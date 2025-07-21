import { type Static, Type } from "@sinclair/typebox";
import { HttpError } from "./httpErrors.js";
import { AllProviderTypesSchema } from "./providers.js";
import {
  getGenericResponseSchema,
  PaginationParamsSchema,
  TypeboxBooleanEnum,
  TypeboxStringEnum,
} from "./schemaDefinitions.js";

const MESSAGES_TAGS = ["Messages"];

/** Common */

const IdSchema = Type.Object({
  id: Type.String({ format: "uuid", description: "Unique Id of the resource" }),
});

const GenericIdResponseSchema = getGenericResponseSchema(IdSchema);
export type GenericIdResponse = Static<typeof GenericIdResponseSchema>;

export const ConfidentialSecurity = "confidential";
export const PublicSecurity = "public";
export const SecurityLevelsSchema = TypeboxStringEnum(
  [ConfidentialSecurity, PublicSecurity],
  undefined,
  "Confidentiality level of the message",
);
export type SecurityLevels = Static<typeof SecurityLevelsSchema>;

/**  */

export const MessageInputSchema = Type.Object({
  threadName: Type.Optional(
    Type.String({
      description: "Thread Name used to group messages",
      minLength: 1,
    }),
  ),
  subject: Type.String({
    description:
      "Subject. This is the only part that will be seen outside of the messaging platform is security is 'confidential'",
    minLength: 1,
  }),
  excerpt: Type.Optional(
    Type.String({
      description: "Brief description of the message",
    }),
  ),
  plainText: Type.String({
    description: "Plain text version of the message",
    minLength: 1,
  }),
  richText: Type.Optional(
    Type.String({
      description: "Rich text (html) version of the message",
    }),
  ),
  language: TypeboxStringEnum(
    ["en", "ga"],
    undefined,
    "Language used to send the message",
  ),
});
export type MessageInput = Static<typeof MessageInputSchema>;

export const CreateMessageOptionsSchema = Type.Object({
  preferredTransports: Type.Array(AllProviderTypesSchema),
  userIds: Type.Array(Type.String()),
  security: SecurityLevelsSchema,
  scheduleAt: Type.String({ format: "date-time" }),
});
export type CreateMessageOptions = Static<typeof CreateMessageOptionsSchema>;

/** Create message */

export const CreateMessageBodySchema = Type.Object({
  preferredTransports: Type.Array(AllProviderTypesSchema, {
    description:
      "The list of the preferred transports to use. If the selected transports are not available for the recipient, others will be used",
  }),
  recipientUserId: Type.String({
    description: "Unique user id of the recipient",
  }),
  security: SecurityLevelsSchema,
  scheduleAt: Type.String({
    format: "date-time",
    description: "Date and time of when schedule the message",
  }),
  message: MessageInputSchema,
  attachments: Type.Optional(Type.Array(Type.String({ format: "uuid" }))),
});

export type CreateMessageBody = Static<typeof CreateMessageBodySchema>;

export const CreateMessageReqSchema = {
  description: "Creates a message",
  tags: MESSAGES_TAGS,
  body: CreateMessageBodySchema,
  operationId: "CreateMessage",
  response: {
    "4xx": HttpError,
    "5xx": HttpError,
    201: GenericIdResponseSchema,
  },
};

export type SenderUser = {
  id: string;
  organizationId: string;
  isM2MApplication: boolean;
};

/** Get message */

export const ReadMessageSchema = Type.Object({
  subject: Type.String({
    description:
      "Subject. This is the only part that will be seen outside of the messaging platform is security is 'confidential'",
  }),
  createdAt: Type.String({ description: "Creation date time" }),
  threadName: Type.Union([
    Type.String({
      description: "Thread Name used to group messages",
    }),
    Type.Null(),
  ]),
  organisationId: Type.String({ description: "Organisation sender id" }),
  recipientUserId: Type.String({ description: "Unique id of the recipient" }),
  excerpt: Type.Union([
    Type.String({ description: "Brief description of the message" }),
    Type.Null(),
  ]),
  plainText: Type.String({ description: "Plain text version of the message" }),
  richText: Type.Union([
    Type.String({ description: "Rich text version of the message" }),
    Type.Null(),
  ]),
  isSeen: Type.Boolean({
    description: "True if the message has already been seen by the recipient",
  }),
  security: SecurityLevelsSchema,
  attachments: Type.Array(Type.String({ format: "uuid" }), {
    description: "Ids of the related attachments",
  }),
});
export type ReadMessage = Static<typeof ReadMessageSchema>;

export const PartialReadMessageSchema = Type.Pick(ReadMessageSchema, [
  "recipientUserId",
  "organisationId",
]);
export type PartialReadMessage = Static<typeof PartialReadMessageSchema>;

const GetMessageResponseSchema = getGenericResponseSchema(ReadMessageSchema);
export type GetMessageResponse = Static<typeof GetMessageResponseSchema>;
const GetPartialMessageResponseSchema = getGenericResponseSchema(
  PartialReadMessageSchema,
);
export type GetPartialMessageResponse = Static<
  typeof GetPartialMessageResponseSchema
>;

export const GetMessageReqSchema = {
  description: "Returns the requested message",
  tags: MESSAGES_TAGS,
  operationId: "GetMessage",
  params: Type.Object({
    messageId: Type.String({
      format: "uuid",
      description: "The requested message unique id",
    }),
  }),
  response: {
    200: Type.Union([
      GetMessageResponseSchema,
      GetPartialMessageResponseSchema,
    ]),
    "4xx": HttpError,
    "5xx": HttpError,
  },
};

export type GetMessageParams = Static<typeof GetMessageReqSchema.params>;

/** List messages */

export const MessageListItemSchema = Type.Object({
  id: Type.String({ description: "Unique Id of the message" }),
  subject: Type.String({ description: "Subject" }),
  createdAt: Type.String({ description: "Creation date time" }),
  threadName: Type.Union([
    Type.String({
      description: "Thread Name used to group messages",
    }),
    Type.Null(),
  ]),
  organisationId: Type.String({ description: "Organisation sender id" }),
  recipientUserId: Type.String({ description: "Unique id of the recipient" }),
  attachmentsCount: Type.Integer({ description: "Number of attachments" }),
});
export const MessageListSchema = Type.Array(MessageListItemSchema);
export type MessageList = Static<typeof MessageListSchema>;

const ListMessageResponseSchema = getGenericResponseSchema(MessageListSchema);
export type ListMessageResponse = Static<typeof ListMessageResponseSchema>;

const IdParamsSchema = Type.Object({
  recipientUserId: Type.Optional(
    Type.String({
      description: "Either recipientUserId and organisationId are mandatory",
    }),
  ),
  organisationId: Type.Optional(
    Type.String({
      description: "Either recipientUserId and organisationId are mandatory",
    }),
  ),
});

const DeliveredSchema = Type.Literal("delivered");
export type Delivered = Static<typeof DeliveredSchema>;

export const SearchParamsSchema = Type.Object({
  status: Type.Optional(DeliveredSchema),
  isSeen: Type.Optional(TypeboxBooleanEnum()),
  search: Type.Optional(Type.String()),
});

const ListMessagesParamsSchema = Type.Optional(
  Type.Composite([SearchParamsSchema, IdParamsSchema, PaginationParamsSchema]),
);

export type ListMessagesReqParams = Static<typeof ListMessagesParamsSchema>;

export const ListMessagesReqGetSchema = {
  description:
    "Returns all the messages for the requested organisation or the requested recipient",
  tags: MESSAGES_TAGS,
  operationId: "ListMessages",
  querystring: ListMessagesParamsSchema,
  response: {
    200: ListMessageResponseSchema,
    "4xx": HttpError,
    "5xx": HttpError,
  },
};

export const ListMessagesReqPostSchema = {
  description:
    "Returns all the messages for the requested organisation or the requested recipient",
  tags: MESSAGES_TAGS,
  operationId: "ListMessagesPost",
  body: ListMessagesParamsSchema,
  response: {
    200: ListMessageResponseSchema,
    "4xx": HttpError,
    "5xx": HttpError,
  },
};

export type MessageToDeliverWoAttachments = {
  id: string;
  transports?: string[];
  subject: string;
  excerpt?: string;
  body: string;
  securityLevel: SecurityLevels;
  richText?: string;
};

export type MessageToDeliver = MessageToDeliverWoAttachments & {
  attachmentIds: string[] | undefined;
};
