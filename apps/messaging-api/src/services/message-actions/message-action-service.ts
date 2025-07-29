import { httpErrors } from "@fastify/sensible";
import type { FastifyBaseLogger } from "fastify";
import type { Pool, PoolClient } from "pg";
import type { PutMessageActionBody } from "../../types/message-actions.js";
import {
  MessagingEventLogger,
  MessagingEventType,
} from "../messages/event-logger.js";
import { ProfilePersonalSdkWrapper } from "../users/profile-personal-sdk-wrapper.js";

export async function updateMessageAction(params: {
  loggedInUser: { userId: string; accessToken: string };
  body: PutMessageActionBody;
  pool: Pool;
  logger: FastifyBaseLogger;
}): Promise<void> {
  const { loggedInUser, body, pool, logger } = params;
  const client = await pool.connect();
  try {
    const recipientUserId = await findMessageRecipient({
      client,
      messageId: body.messageId,
    });
    if (!recipientUserId) {
      throw httpErrors.notFound("message not found");
    }
    if (recipientUserId !== loggedInUser.userId) {
      const profileSdk = new ProfilePersonalSdkWrapper(logger, loggedInUser);
      const linkedProfilesIds = await profileSdk.getLinkedProfileIds(
        loggedInUser.userId,
      );

      if (!linkedProfilesIds.includes(recipientUserId)) {
        throw httpErrors.notFound("message not found for user");
      }
    }
    await setMessageReadStatus({
      client,
      pool,
      body,
      userId: recipientUserId,
      logger,
    });
  } finally {
    client.release();
  }
}

async function findMessageRecipient(params: {
  client: PoolClient;
  messageId: string;
}): Promise<string | undefined> {
  const queryResult = await params.client.query<{
    recipientUserId: string;
  }>(
    `
    select user_id as "recipientUserId" from messages where id = $1
    `,
    [params.messageId],
  );
  return queryResult.rows.at(0)?.recipientUserId;
}

async function setMessageReadStatus(params: {
  client: PoolClient;
  body: PutMessageActionBody;
  userId: string;
  pool: Pool;
  logger: FastifyBaseLogger;
}): Promise<void> {
  const updateQueryResult = await params.client.query<{ isSeen: boolean }>(
    `
    with message_selection as(
        select m.id from messages m
        where 
            m.user_id = $1
            and is_delivered = true 
            and m.id = $2
            and $3 != m.is_seen
    )
    update messages set is_seen = $3
    where id = any(select id from message_selection)
    returning is_seen as "isSeen", id
    `,
    [params.userId, params.body.messageId, params.body.isSeen],
  );
  if (updateQueryResult.rowCount) {
    // the Unseen event is not important for the
    // messaging-events-logs feature
    // a public servant only needs to know if
    // the message has been opened
    // at any point in time
    if (!params.body.isSeen) {
      return;
    }

    const eventLogger = new MessagingEventLogger(params.pool, params.logger);
    eventLogger.log(MessagingEventType.citizenSeenMessage, {
      messageId: params.body.messageId,
    });
    await eventLogger.commit();
  }
}
