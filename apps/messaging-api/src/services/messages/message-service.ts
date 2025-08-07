import { httpErrors } from "@fastify/sensible";
import { type Static, Type } from "@sinclair/typebox";
import type { FastifyBaseLogger } from "fastify";
import type { Pool, QueryResult } from "pg";
import {
  type CreateMessageBody,
  type Delivered,
  type MessageList,
  MessageListItemSchema,
  type PartialReadMessage,
  type ReadMessage,
} from "../../types/messages.js";
import type {
  AcceptedQueryBooleanValues,
  PaginationParams,
} from "../../types/schemaDefinitions.js";
import type { FeatureFlagsWrapper } from "../../utils/feature-flags.js";
import { ProfilePersonalSdkWrapper } from "../users/profile-personal-sdk-wrapper.js";
import { MessagesProcessor } from "./messages-processor.js";

export async function listMessages(params: {
  loggedInUserData: {
    organizationId: string | undefined;
    userId: string;
    accessToken: string;
  };
  query: {
    recipientUserId: string | undefined;
    organisationId: string | undefined;
    messagesStatus: Delivered | undefined;
    isSeen: AcceptedQueryBooleanValues | undefined;
    search: string | undefined;
  };
  pool: Pool;
  pagination: Required<PaginationParams>;
  logger: FastifyBaseLogger;
}): Promise<{ data: MessageList; totalCount: number }> {
  const { loggedInUserData, query, pool, pagination, logger } = params;

  const requestedIds = await getRequestedIds(loggedInUserData, query, logger);

  return queryMessagesForList({
    pool,
    recipientUserIds: requestedIds.userIds,
    organizationId: requestedIds.organizationId,
    query,
    pagination,
  });
}

export async function getMessage(params: {
  pool: Pool;
  userId?: string;
  messageId: string;
  loggedInUser: { userId: string; accessToken: string };
  hasOnboardingPermission: boolean;
  logger: FastifyBaseLogger;
}): Promise<ReadMessage | PartialReadMessage> {
  const args: string[] = [params.messageId];
  let userIdClause = "";
  if (params.userId) {
    args.push(params.userId);
    userIdClause = "AND messages.user_id = $2";
  }

  const data = await params.pool.query<ReadMessage>(
    `   
    SELECT 
        messages.subject as "subject", 
        messages.excerpt as "excerpt", 
        messages.plain_text as "plainText",
        messages.rich_text as "richText",
        messages.created_at as "createdAt",
        messages.thread_name as "threadName",
        messages.organisation_id as "organisationId",
        messages.user_id as "recipientUserId",
        messages.is_seen as "isSeen",
        messages.security_level as "security",
        COALESCE(ARRAY_AGG(attachments_messages.attachment_id) FILTER (WHERE attachments_messages.attachment_id IS NOT NULL), '{}') AS "attachments"
    FROM messages
    LEFT JOIN attachments_messages 
        ON attachments_messages.message_id = messages.id
    WHERE 
        messages.id = $1
        AND messages.scheduled_at <= now()
        ${userIdClause}
    GROUP BY 
        messages.subject, 
        messages.excerpt, 
        messages.plain_text, 
        messages.rich_text, 
        messages.created_at, 
        messages.thread_name, 
        messages.organisation_id, 
        messages.user_id, 
        messages.is_seen, 
        messages.security_level
    ORDER BY messages.created_at DESC;
    `,
    args,
  );

  if (data.rowCount === 0) {
    const errorMessage = params.userId
      ? `No message with id ${params.messageId} for the logged in user does exist`
      : `No message with id ${params.messageId} exist`;
    throw httpErrors.notFound(errorMessage);
  }
  const message = data.rows[0];
  params.logger.debug(
    {
      messageId: `${params.messageId.substring(0, 5)}...`,
      recipientId: `${message.recipientUserId.substring(0, 4)}...`,
      isRecipientIdEqualToLoggedIn:
        message.recipientUserId === params.loggedInUser.userId,
    },
    "Retrieved message",
  );
  return prepareGetMessageResponse({ ...params, message: data.rows[0] });
}

export async function processMessage(params: {
  pool: Pool;
  sender: {
    id: string;
    organizationId: string;
    isM2MApplication: boolean;
  };
  message: CreateMessageBody;
  logger: FastifyBaseLogger;
  featureFlagsWrapper: FeatureFlagsWrapper;
}) {
  const messagesProcessor = new MessagesProcessor(params.pool, params.logger);

  return messagesProcessor.processMessage({
    message: params.message,
    senderUser: params.sender,
    featureFlagsWrapper: params.featureFlagsWrapper,
  });
}

async function getRequestedIds(
  loggedInUserData: {
    organizationId: string | undefined;
    userId: string;
    accessToken: string;
  },
  query: {
    recipientUserId: string | undefined;
    organisationId: string | undefined;
  },
  logger: FastifyBaseLogger,
): Promise<{ userIds: string[]; organizationId: string | undefined }> {
  if (loggedInUserData.organizationId) {
    throw httpErrors.forbidden("Public servant can't access messages");
  }
  // if the citizen is asking specifically for its own data,
  // without linked ids, then return only its own data
  if (loggedInUserData.userId === query.recipientUserId) {
    return {
      userIds: [query.recipientUserId],
      organizationId: query.organisationId,
    };
  }

  const profileSdk = new ProfilePersonalSdkWrapper(logger, loggedInUserData);
  const linkedProfilesIds = await profileSdk.getLinkedProfileIds(
    loggedInUserData.userId,
  );
  const userIds = [loggedInUserData.userId, ...linkedProfilesIds];

  if (!query.recipientUserId) {
    return { userIds, organizationId: query.organisationId };
  }

  if (userIds.includes(query.recipientUserId)) {
    return {
      userIds: [query.recipientUserId],
      organizationId: query.organisationId,
    };
  }

  throw httpErrors.forbidden(
    "Not allowed to see messages for the requested user",
  );
}

async function queryMessagesForList(params: {
  pool: Pool;
  recipientUserIds: string[];
  organizationId: string | undefined;
  pagination: Required<PaginationParams>;
  query: {
    isSeen: AcceptedQueryBooleanValues | undefined;
    search: string | undefined;
  };
}): Promise<{ data: MessageList; totalCount: number }> {
  const { pool, recipientUserIds, organizationId, pagination, query } = params;
  const MessageListItemWithCount = Type.Composite([
    MessageListItemSchema,
    Type.Object({ count: Type.Number() }),
  ]);

  type QueryRow = Static<typeof MessageListItemWithCount>;
  let messagesQueryResult: QueryResult<QueryRow> | undefined;
  try {
    messagesQueryResult = await pool.query<QueryRow>(
      `
          WITH count_selection AS (
              SELECT count(*) 
              FROM messages
              WHERE
                  CASE WHEN $1::text IS NOT NULL THEN organisation_id = $1 ELSE true END
                  AND user_id = ANY ($2)
                  AND CASE WHEN $5::boolean IS NOT NULL THEN messages.is_seen = $5::boolean ELSE true END
                  AND subject ilike $6
                  AND scheduled_at <= now()
          )
          SELECT 
              messages.id,
              messages.subject,
              messages.thread_name AS "threadName",
              messages.organisation_id AS "organisationId",
              messages.user_id AS "recipientUserId",
              messages.scheduled_at AS "createdAt",
              (SELECT count FROM count_selection) AS "count",
              COALESCE(COUNT(attachments_messages.attachment_id), 0) AS "attachmentsCount"
          FROM messages
          LEFT JOIN attachments_messages 
              ON attachments_messages.message_id = messages.id
          WHERE 
              CASE WHEN $1::text IS NOT NULL THEN organisation_id = $1 ELSE true END
              AND user_id = ANY ($2)
              AND CASE WHEN $5::boolean IS NOT NULL THEN messages.is_seen = $5::boolean ELSE true END
              AND subject ilike $6
              AND scheduled_at <= now()
          GROUP BY 
              messages.id, 
              messages.subject, 
              messages.thread_name, 
              messages.organisation_id, 
              messages.user_id, 
              messages.scheduled_at
          ORDER BY messages.scheduled_at DESC
          LIMIT $3
          OFFSET $4;
        `,
      [
        organizationId || null,
        recipientUserIds,
        pagination.limit,
        pagination.offset,
        query.isSeen === undefined ? null : query.isSeen,
        query.search ? `%${query.search}%` : "%%",
      ],
    );
  } catch (error) {
    throw httpErrors.createError(500, "failed to query organisation messages", {
      parent: error,
    });
  }

  const totalCount = messagesQueryResult.rows.at(0)?.count
    ? Number(messagesQueryResult.rows.at(0)?.count)
    : undefined;

  if (!totalCount) {
    return { data: [], totalCount: 0 };
  }

  // removing count field from output
  const output = messagesQueryResult.rows.map(
    ({ count, ...otherFields }) => otherFields,
  );

  return { data: output, totalCount };
}

async function prepareGetMessageResponse({
  loggedInUser,
  hasOnboardingPermission,
  message,
  messageId,
  logger,
}: {
  loggedInUser: { userId: string; accessToken: string };
  hasOnboardingPermission: boolean;
  message: ReadMessage;
  messageId: string;
  logger: FastifyBaseLogger;
}): Promise<ReadMessage | PartialReadMessage> {
  if (loggedInUser.userId === message.recipientUserId) {
    logger.debug("Logged user id is the same as the recipient");
    return message;
  }

  if (hasOnboardingPermission) {
    logger.debug(
      "Logged user has onboarding permissions, returning partial info",
    );
    return {
      recipientUserId: message.recipientUserId,
      organisationId: message.organisationId,
    };
  }

  const profileSdk = new ProfilePersonalSdkWrapper(logger, loggedInUser);
  const linkedProfilesIds = await profileSdk.getLinkedProfileIds(
    loggedInUser.userId,
  );

  logger.debug(
    {
      linkedProfileIds: linkedProfilesIds.map((l) => `${l.substring(0, 4)}...`),
    },
    "Got linked profile ids",
  );

  if (linkedProfilesIds.includes(message.recipientUserId)) {
    logger.debug(
      "Recipient user is linked to logged in user, returning the message",
    );
    return message;
  }

  throw httpErrors.notFound(
    `No message with id ${messageId} for the logged in user does exist`,
  );
}
