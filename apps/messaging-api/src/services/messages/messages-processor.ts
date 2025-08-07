import { randomUUID } from "node:crypto";
import { httpErrors } from "@fastify/sensible";
import type { FastifyBaseLogger } from "fastify";
import type { Pool, PoolClient } from "pg";
import type { CreateMessageBody, SenderUser } from "../../types/messages.js";
import { getM2MSchedulerSdk } from "../../utils/authentication-factory.js";
import type { FeatureFlagsWrapper } from "../../utils/feature-flags.js";
import { utils } from "../../utils/utils.js";
import { ProfileM2MSdkWrapper } from "../users/profile-m2m-sdk-wrapper.js";
import type { GetProfileResponse } from "../users/profile-sdk-wrapper.js";
//import { ensureUserCanAccessAttachments } from "./attachments.js";
import { MessagingEventLogger, MessagingEventType } from "./event-logger.js";

export class MessagesProcessor {
  constructor(
    private readonly pool: Pool,
    private readonly logger: FastifyBaseLogger,
  ) {}

  async processMessage(params: {
    message: CreateMessageBody;
    senderUser: SenderUser;
    featureFlagsWrapper: FeatureFlagsWrapper;
  }): Promise<{ jobId: string; userId: string; messageId: string }> {
    const { message, senderUser } = params;
    const { recipientProfile, senderProfile, senderApplication } =
      await this.ensureParamsForSendingAreValid(params);
    const client = await this.pool.connect();
    let created = false;
    const messagingEventLogger = new MessagingEventLogger(
      this.pool,
      this.logger,
    );
    try {
      await client.query("BEGIN");
      const createMessageResult = await this.createMessage({
        message,
        recipientProfile,
        senderProfile,
        senderApplication,
        senderUser,
        client,
        messagingEventLogger,
      });
      created = true;
      const scheduledMessages = await this.scheduleMessage({
        organizationId: senderUser.organizationId,
        toScheduleMessage: {
          messageId: createMessageResult.id,
          userId: message.recipientUserId,
          scheduleAt: message.scheduleAt,
        },
        client,
        messagingEventLogger,
      });
      await client.query("COMMIT");
      await messagingEventLogger.commit();
      return scheduledMessages;
    } catch (error) {
      await client.query("ROLLBACK");
      if (!created) {
        throw httpErrors.createError(500, "Message creation failed", {
          parent: error,
        });
      }
      throw error;
    } finally {
      client.release();
    }
  }

  private async createMessage(params: {
    message: CreateMessageBody;
    recipientProfile: GetProfileResponse;
    senderProfile?: GetProfileResponse;
    senderApplication?: { id: string };
    senderUser: SenderUser;
    client: PoolClient;
    messagingEventLogger: MessagingEventLogger;
  }) {
    const {
      message,
      senderUser,
      recipientProfile,
      senderProfile,
      client,
      messagingEventLogger,
    } = params;
    const messageInsertResult = await this.insertMessage({
      messageBody: message,
      senderUser,
      client,
    });

    messagingEventLogger.log(MessagingEventType.createRawMessage, {
      organisationName: senderUser.organizationId,
      security: message.security,
      transports: message.preferredTransports,
      scheduledAt: message.scheduleAt,
      messageId: messageInsertResult.id,
      threadName: message.message.threadName || "",
      subject: message.message.subject,
      excerpt: message.message.excerpt,
      richText: message.message.richText,
      plainText: message.message.plainText,
      language: message.message.language,
      senderFullName: senderProfile?.publicName,
      senderPPSN: senderProfile?.details?.ppsn || "",
      senderUserId: senderUser.id || "",
      receiverFullName: recipientProfile.publicName,
      receiverPPSN: recipientProfile.details?.ppsn || "",
      receiverUserId: message.recipientUserId,
      senderApplicationId: params.senderApplication?.id || "",
      attachments: message.attachments,
    });

    return messageInsertResult;
  }

  private async scheduleMessage(params: {
    client: PoolClient;
    organizationId: string;
    toScheduleMessage: {
      messageId: string;
      userId: string;
      scheduleAt: string;
    };
    messagingEventLogger: MessagingEventLogger;
  }): Promise<{ jobId: string; userId: string; messageId: string }> {
    try {
      const result = await this.invokeScheduler({
        userMessageIds: [params.toScheduleMessage],
        scheduleAt: params.toScheduleMessage.scheduleAt,
        organisationId: params.organizationId,
        client: params.client,
      });

      params.messagingEventLogger.log(MessagingEventType.scheduleMessage, {
        messageId: params.toScheduleMessage.messageId,
        receiverUserId: params.toScheduleMessage.userId,
      });

      return result[0];
    } catch (error) {
      params.messagingEventLogger.log(
        MessagingEventType.scheduleMessageError,
        params.toScheduleMessage,
      );
      throw httpErrors.createError(503, "Error scheduling messages", {
        parent: error,
      });
    }
  }

  private async ensureParamsForSendingAreValid(params: {
    message: CreateMessageBody;
    senderUser: SenderUser;
    featureFlagsWrapper: FeatureFlagsWrapper;
  }): Promise<
    | {
        recipientProfile: GetProfileResponse;
        senderProfile: GetProfileResponse;
        senderApplication: undefined;
      }
    | {
        senderProfile: undefined;
        senderApplication: { id: string };
        recipientProfile: GetProfileResponse;
      }
  > {
    const { message, senderUser } = params;
    const { recipientProfile, senderProfile } = await this.ensureUsersExists({
      recipientUserProfileId: message.recipientUserId,
      senderUser: senderUser.isM2MApplication ? undefined : senderUser,
      organizationId: senderUser.organizationId,
      featureFlagsWrapper: params.featureFlagsWrapper,
    });

    // TODO: Optimise Check and restore
    // await ensureUserCanAccessAttachments({
    //   userProfileId: message.recipientUserId,
    //   organizationId: senderUser.organizationId,
    //   attachmentIds: message.attachments ?? [],
    //   logger: this.logger,
    // });

    if (!senderProfile) {
      return {
        recipientProfile,
        senderApplication: { id: senderUser.id },
        senderProfile: undefined,
      };
    }

    return { recipientProfile, senderProfile, senderApplication: undefined };
  }

  private async ensureUsersExists(params: {
    recipientUserProfileId: string;
    senderUser?: SenderUser;
    organizationId: string;
    featureFlagsWrapper: FeatureFlagsWrapper;
  }): Promise<{
    recipientProfile: GetProfileResponse;
    senderProfile?: GetProfileResponse;
  }> {
    const profileWrapper = new ProfileM2MSdkWrapper(
      this.logger,
      params.organizationId,
    );
    const recipientProfile = await profileWrapper.getProfile(
      params.recipientUserProfileId,
    );

    const isConsentEnabled =
      await params.featureFlagsWrapper.isConsentFlagEnabled({
        userId: params.recipientUserProfileId,
      });

    if (isConsentEnabled) {
      profileWrapper.ensureUserConsented(recipientProfile.consentStatuses);
    }

    if (!params.senderUser) {
      return { recipientProfile };
    }

    const senderProfile = await profileWrapper.getProfile(params.senderUser.id);

    return { recipientProfile, senderProfile };
  }

  private async insertMessage(params: {
    messageBody: CreateMessageBody;
    senderUser: SenderUser;
    client: PoolClient;
  }) {
    const { messageBody, senderUser, client } = params;
    const valueArray = [
      false,
      messageBody.recipientUserId,
      messageBody.message.subject,
      messageBody.message.excerpt ?? null,
      messageBody.message.plainText,
      messageBody.message.richText ?? null,
      messageBody.security,
      messageBody.message.language,
      messageBody.preferredTransports.length
        ? utils.postgresArrayify(messageBody.preferredTransports)
        : null,
      messageBody.message.threadName,
      senderUser.organizationId,
      messageBody.scheduleAt,
    ];

    const values = valueArray.map((_, i) => `$${i + 1}`).join(", ");
    const insertQueryResult = await client.query<{
      id: string;
      user_id: string;
    }>(
      `
          insert into messages(
              is_delivered,
              user_id,
              subject,
              excerpt,
              plain_text,
              rich_text,
              security_level,
              lang,
              preferred_transports,
              thread_name,
              organisation_id,
              scheduled_at
          ) values (${values})
          returning 
            id, user_id;
        `,
      valueArray,
    );

    const message = insertQueryResult.rows[0];

    if (!message) {
      throw new Error("no message id generated");
    }

    if (params.messageBody.attachments?.length) {
      let attachmentIndex = 2;
      const attachmentValues = [];
      const attachmentIndexes = [];
      for (const attId of params.messageBody.attachments) {
        attachmentIndexes.push(`($1, $${attachmentIndex++})`);
        attachmentValues.push(attId);
      }

      await client.query(
        `
              insert into attachments_messages(
                message_id,
                attachment_id) values ${attachmentIndexes.join(", ")};
              `,
        [message.id, ...attachmentValues],
      );
    }

    return message;
  }

  private async invokeScheduler(params: {
    userMessageIds: { userId: string; messageId: string }[];
    scheduleAt: string;
    organisationId: string;
    client: PoolClient;
  }) {
    const { userMessageIds, scheduleAt, organisationId, client } = params;
    const valueArgs: string[] = [];
    const values: string[] = ["message", organisationId];
    let valueArgIndex = values.length;

    for (const pt of userMessageIds) {
      valueArgs.push(
        `($1, $2, $${++valueArgIndex}, $${++valueArgIndex}, $${++valueArgIndex})`,
      );
      values.push(pt.messageId, pt.userId, randomUUID());
    }

    const jobs: {
      jobId: string;
      userId: string;
      messageId: string;
      token: string;
    }[] = [];
    try {
      const jobInsertResult = await client.query<{
        jobId: string;
        userId: string;
        entityId: string;
        token: string;
      }>(
        `
          insert into jobs(job_type, organisation_id, job_id, user_id, job_token)
          values ${valueArgs.join(", ")}
          returning id as "jobId", user_id as "userId", job_id as "entityId", job_token as "token"
        `,
        values,
      );
      jobs.push(
        ...jobInsertResult.rows.map(({ entityId, ...row }) => ({
          ...row,
          messageId: entityId,
        })),
      );
    } catch {
      throw httpErrors.internalServerError("failed to create jobs");
    }

    const scheduleBody = jobs.map((job) => {
      const callbackUrl = new URL(
        `/api/v1/jobs/${job.jobId}`,
        process.env.WEBHOOK_URL_BASE,
      );

      return {
        webhookUrl: callbackUrl.toString(),
        webhookAuth: job.token,
        executeAt: scheduleAt,
      };
    });

    const schedulerSdk = await getM2MSchedulerSdk(this.logger, organisationId);
    const { error } = await schedulerSdk.scheduleTasks(scheduleBody);

    if (error) {
      const errorDetail =
        (error as { detail?: string })?.detail ?? "Unknown error";
      throw httpErrors.createError(503, errorDetail as string, {
        parent: error,
      });
    }

    return jobs;
  }
}
