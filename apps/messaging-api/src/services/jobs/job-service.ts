import { isNativeError } from "node:util/types";
import type { NodeCache } from "@cacheable/node-cache";
import { httpErrors } from "@fastify/sensible";
import {
  type LoggingError,
  toLoggingError,
} from "@ogcio/fastify-logging-wrapper";
import type { FastifyBaseLogger } from "fastify";
import { isHttpError } from "http-errors";
import type { Pool, PoolClient } from "pg";
import type { EnvConfig } from "../../plugins/external/env.js";
import { JobTypes } from "../../types/jobs.js";
import type {
  MessageToDeliver,
  MessageToDeliverWoAttachments,
} from "../../types/messages.js";
import type { Provider } from "../../types/providers.js";
import type { I18n } from "../../utils/i18n.js";
import type { ServiceError } from "../../utils/utils.js";
import {
  type MessagingEventLogger,
  MessagingEventType,
} from "../messages/event-logger.js";
import { getPrimaryProvider } from "../providers/provider-service.js";
import { TransportFactory } from "../providers/transport-factory.js";
import { SmsSender } from "../sms/sms-sender.js";
import { SnsSmsTransport } from "../sms/sms-transport.js";
import { ProfileM2MSdkWrapper } from "../users/profile-m2m-sdk-wrapper.js";
import type {
  GetOrganisationResponse,
  GetProfileResponse,
  ProfileSdkWrapper,
} from "../users/profile-sdk-wrapper.js";
import { AvailableTransports } from "../users/shared-users.js";
import { prepareForSecureDelivery } from "./secure-message-processor.js";

export type ScheduledMessageStatus =
  | "pending"
  | "working"
  | "failed"
  | "delivered";
export const JobStatus = {
  Working: "working",
  Pending: "pending",
  Failed: "failed",
  Delivered: "delivered",
};

export type RunningJob = {
  jobId: string;
  userId: string;
  type: string;
  status: ScheduledMessageStatus;
  organizationId: string;
};

export const executeJob = async (params: {
  config: EnvConfig;
  pool: Pool;
  logger: FastifyBaseLogger;
  jobId: string;
  token: string;
  eventLogger: MessagingEventLogger;
  i18n: I18n;
  // biome-ignore lint/suspicious/noExplicitAny: insert any type
  cache: NodeCache<any>;
}): Promise<void> => {
  const job = await setJobAsRunning({
    eventLogger: params.eventLogger,
    pool: params.pool,
    job: { id: params.jobId, token: params.token },
  });
  switch (job.type) {
    case JobTypes.Message:
      await processMessageJob({
        config: params.config,
        job,
        eventLogger: params.eventLogger,
        pool: params.pool,
        logger: params.logger,
        i18n: params.i18n,
        cache: params.cache,
      });
      break;
    default:
      params.logger.warn(job, "Job has unrecognized type");
  }
};

async function setJobAsRunning(params: {
  eventLogger: MessagingEventLogger;
  pool: Pool;
  job: { id: string; token: string };
}): Promise<RunningJob> {
  const { pool, job, eventLogger } = params;
  let runningJob: RunningJob | undefined;
  try {
    const jobStatusResult = await pool.query<{
      status: ScheduledMessageStatus;
      entityId: string;
      organizationId: string;
    }>(
      `
        SELECT
          coalesce(delivery_status, 'pending') as "status",
          job_id as "entityId",
          organisation_id as "organizationId"
        FROM jobs WHERE id = $1
        AND case when delivery_status is not null then delivery_status != $2 else true end
        AND job_token = $3
    `,
      [job.id, JobStatus.Delivered, job.token],
    );

    const jobResult = jobStatusResult.rows.at(0);

    if (!jobResult) {
      throw httpErrors.notFound("job doesn't exist");
    }

    if (jobResult.status === JobStatus.Working) {
      throw httpErrors.badRequest("job is already in progress");
    }

    eventLogger.log(
      MessagingEventType.deliverMessagePending,
      { messageId: jobResult.entityId }, // job id error field?
    );

    const updateResult = await pool.query<RunningJob>(
      `
        UPDATE jobs SET delivery_status = $1
        WHERE id = $2
        returning 
        user_id as "userId",
        job_type as "type",
        job_id as "jobId",
        organisation_id as "organizationId",
        delivery_status as "status"
    `,
      [JobStatus.Working, job.id],
    );

    runningJob = updateResult.rows.at(0);
    if (!runningJob) {
      throw httpErrors.notFound("Not able to find job to update");
    }
  } catch (err) {
    eventLogger.log(MessagingEventType.deliverMessageError, {
      messageId: job.id,
    });
    if (isHttpError(err)) {
      throw err;
    }

    throw httpErrors.createError(500, "Failed fetching/updating job", {
      parent: err,
    });
  }

  if (!runningJob.userId || !runningJob.type) {
    eventLogger.log(MessagingEventType.deliverMessageError, {
      messageId: runningJob?.jobId || job.id,
    });
    throw httpErrors.internalServerError(
      `job row with id ${runningJob.jobId} missing critical fields`,
    );
  }

  return runningJob;
}

async function processMessageJob(params: {
  config: EnvConfig;
  job: RunningJob;
  eventLogger: MessagingEventLogger;
  pool: Pool;
  logger: FastifyBaseLogger;
  i18n: I18n;
  // biome-ignore lint/suspicious/noExplicitAny: insert any type
  cache: NodeCache<any>;
}) {
  const { job, eventLogger, pool, logger, i18n, config, cache } = params;
  let profileWrapper: ProfileSdkWrapper | null = null;
  let profile: GetProfileResponse | null = null;
  let deliveryError: LoggingError | undefined;
  let organisation: NonNullable<GetOrganisationResponse>["data"] | undefined;

  try {
    profileWrapper = new ProfileM2MSdkWrapper(logger, job.organizationId);
  } catch (e) {
    const msg = isNativeError(e)
      ? e.message
      : "failed to initialize profile SDK";
    deliveryError = toLoggingError(httpErrors.internalServerError(msg));
    logger.error({ error: deliveryError.parent }, deliveryError.message);
  }

  if (!profileWrapper) {
    return updateJobStatus({ ...params, deliveryError });
  }

  try {
    profile = await profileWrapper.getProfile(job.userId);
  } catch (e) {
    const msg = isNativeError(e) ? e.message : "failed to retrieve profile";
    deliveryError = toLoggingError(httpErrors.internalServerError(msg));
    logger.error({ error: deliveryError.parent }, deliveryError.message);
  }

  if (!profile) {
    return updateJobStatus({ ...params, deliveryError });
  }

  try {
    organisation = await profileWrapper.getOrganisationWithCache(
      job.organizationId,
      cache,
      logger,
    );
  } catch (e) {
    const msg = isNativeError(e)
      ? e.message
      : "failed to retrieve organisation";
    deliveryError = toLoggingError(httpErrors.internalServerError(msg));
    logger.error({ error: deliveryError.parent }, deliveryError.message);
  }

  if (!organisation) {
    return updateJobStatus({ ...params, deliveryError });
  }

  deliveryError = await deliverMessage({
    pool,
    jobId: job.jobId,
    eventLogger,
    organizationId: job.organizationId,
    messageId: job.jobId,
    logger,
    i18n,
    config,
    profile,
    organisation,
  });

  new SmsSender({
    profile,
    organizationId: job.organizationId,
    logger,
    config,
    getTransport: () => new SnsSmsTransport({ config, logger }),
  }).send();
  return updateJobStatus({ ...params, deliveryError });
}

async function deliverMessage(params: {
  pool: Pool;
  messageId: string;
  eventLogger: MessagingEventLogger;
  organizationId: string;
  logger: FastifyBaseLogger;
  jobId: string;
  i18n: I18n;
  config: EnvConfig;
  profile: GetProfileResponse;
  organisation: NonNullable<GetOrganisationResponse>["data"];
}): Promise<LoggingError | undefined> {
  let _err: unknown;
  const { messageId, pool, logger, jobId, eventLogger, profile } = params;

  try {
    const messageData = await getMessageToDeliver({
      messageId,
      recipientUserId: profile.id,
      client: pool,
    });
    const transportErrors = await sendMessageToTransports({
      ...params,
      messageData,
    });

    for (const err of transportErrors) {
      logger.error({ error: err.error }, err.msg);
    }

    const firstError = transportErrors.filter((err) => err.critical).at(0);
    let loggingError: LoggingError | undefined;
    if (firstError) {
      loggingError = toLoggingError(
        httpErrors.internalServerError(firstError.msg),
      );
    }
    if (!loggingError) {
      eventLogger.log(MessagingEventType.deliverMessage, {
        messageId: jobId,
      });
      return undefined;
    }

    return loggingError;
  } catch (err) {
    logger.error({ error: err }, "Deliver message error");
    _err = err;
  }

  if (_err)
    return toLoggingError(
      httpErrors.createError(500, "Error sending message", { parent: _err }),
    );
}

async function getMessageToDeliver(params: {
  messageId: string;
  recipientUserId: string;
  client: PoolClient | Pool;
}): Promise<MessageToDeliver> {
  const { messageId, client } = params;
  const messageUpdateQueryResult = await client.query<
    MessageToDeliverWoAttachments & {
      attachmentId?: string;
    }
  >(
    `
    SELECT 
    m.id,
    m.preferred_transports AS "transports",
    m.excerpt,
    m.subject,
    m.security_level as "securityLevel",
    m.plain_text as "body",
    m.rich_text as "richText",
    aid.attachment_id AS "attachmentId"
    FROM messages m
    LEFT JOIN (
        SELECT attachment_id, message_id 
        FROM attachments_messages
    ) aid
    ON m.id = aid.message_id
    WHERE m.id = $1;
  `,
    [messageId],
  );
  let messageData: MessageToDeliver | undefined;
  const attachmentIds = [];
  for (const row of messageUpdateQueryResult.rows) {
    if (row.attachmentId) {
      attachmentIds.push(row.attachmentId);
    }
    if (!messageData) {
      messageData = {
        body: row.body,
        excerpt: row.excerpt || undefined,
        subject: row.subject,
        transports: row.transports ? row.transports : undefined,
        attachmentIds: undefined,
        securityLevel: row.securityLevel,
        id: row.id,
        richText: row.richText || undefined,
      };
    }
  }

  if (!messageData) {
    throw httpErrors.notFound(`failed to find message for id ${messageId}`);
  }
  messageData.attachmentIds =
    attachmentIds.length > 0 ? attachmentIds : undefined;

  return messageData;
}

async function updateJobStatus(params: {
  deliveryError: LoggingError | undefined;
  pool: Pool;
  job: { jobId: string; userId: string };
}): Promise<void> {
  const { pool, deliveryError, job } = params;

  if (deliveryError) {
    await pool.query(
      `
          UPDATE jobs SET delivery_status = $1
          WHERE job_id = $2 AND user_id = $3
        `,
      [JobStatus.Failed, job.jobId, job.userId],
    );
  } else {
    await setMessageAsDelivered({
      messageId: job.jobId,
      recipientUserId: job.userId,
      pool,
    });
  }
}

async function setMessageAsDelivered(params: {
  messageId: string;
  recipientUserId: string;
  pool: Pool;
}): Promise<void> {
  const { messageId, pool } = params;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const messageUpdateQueryResult = await client.query<{ id: string }>(
      `
    UPDATE messages m set 
      is_delivered = true,
      updated_at = now()
    WHERE m.id = $1
    RETURNING m.id
  `,
      [messageId],
    );

    if (messageUpdateQueryResult.rowCount === 0) {
      throw httpErrors.notFound(`failed to find message for id ${messageId}`);
    }

    await client.query(
      `
      UPDATE jobs SET delivery_status = $1
      WHERE job_id = $2 AND user_id = $3
    `,
      [JobStatus.Delivered, messageId, params.recipientUserId],
    );
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function sendMessageToTransports(params: {
  pool: Pool;
  organizationId: string;
  messageId: string;
  messageData: MessageToDeliver;
  eventLogger: MessagingEventLogger;
  logger: FastifyBaseLogger;
  i18n: I18n;
  config: EnvConfig;
  profile: GetProfileResponse;
  organisation: NonNullable<GetOrganisationResponse>["data"];
}): Promise<ServiceError[]> {
  const {
    messageData,
    eventLogger,
    logger,
    organizationId,
    messageId,
    pool,
    i18n,
    config,
    profile,
    organisation,
  } = params;
  if (!messageData.transports) {
    return [];
  }
  const onlyEditableTransports = messageData.transports.filter(
    (t) => t !== AvailableTransports.LIFE_EVENT,
  );

  // if the only selected transport is life event, we are okay
  if (onlyEditableTransports.length === 0) {
    return [];
  }
  const errors: ServiceError[] = [];
  let fullSuccessCount = 0;

  try {
    const secureMessage = prepareForSecureDelivery({
      profile,
      messageToDeliver: messageData,
      i18n,
      organisation,
    });
    for (const transport of onlyEditableTransports) {
      let provider: Provider | undefined;

      try {
        provider = await getPrimaryProvider({
          organisationId: organizationId,
          providerType: transport,
          pool,
          config,
          logger,
        });
        if (!provider) {
          logger.warn(
            { transport },
            `No primary provider found for organisation ${organizationId}, using default provider`,
          );
          continue;
        }
      } catch (_e) {
        logger.warn(
          { transport },
          `No primary provider found for organisation ${organizationId}`,
        );
        eventLogger.log(MessagingEventType.emailError, {
          messageId,
          messageKey: "noProvider",
        });
        continue;
      }

      try {
        const specificTransport =
          TransportFactory.getSpecificTransport(provider);
        const canBeSent = await specificTransport.checkIfMessageCanBeSent({
          eventLogger,
          message: secureMessage,
          userAddress: profile.email,
        });
        if (!canBeSent) {
          continue;
        }
        await specificTransport.sendMessage({
          message: secureMessage,
          recipientAddress: profile.email,
        });
        fullSuccessCount++;
      } catch (err) {
        logger.error({ error: err }, "Failed to send message");

        eventLogger.log(MessagingEventType.emailError, {
          messageId,
          messageKey: "failedToSend",
          details: JSON.stringify(err),
        });
        errors.push({
          critical: false,
          error: {
            userId: profile.id,
            providerId: provider.id,
            messageId,
          },
          msg: `failed to send ${transport}`,
        });
      }
    }
  } catch (err) {
    errors.push({
      critical: false,
      error: { err },
      msg: isNativeError(err)
        ? err.message
        : "failed to externally transport message",
    });
  }

  if (fullSuccessCount > 0) {
    return errors;
  }

  errors.push({
    critical: true,
    msg: "Not been able to send to any transport",
    error: httpErrors.badGateway("Message has not been sent anywhere"),
  });

  return errors;
}
