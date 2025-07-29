import { MessageSecurityLevel } from "const/messaging"
import z from "zod"

const messageTemplateContentShape = {
  templateName: z.string(),
  richText: z.string(),
  plainText: z.string(),
  subject: z.string(),
}

const baseMessageTemplateSchema = z.object(messageTemplateContentShape)

const emailProviderContentShape = {
  id: z.string(),
  providerName: z.string(),
  smtpHost: z.string(),
  smtpPort: z.number(),
  username: z.string(),
  password: z.string(),
  fromAddress: z.string(),
  throttle: z.number(),
  ssl: z.boolean(),
  isPrimary: z.boolean(),
}

const baseEmailProviderSchema = z.object(emailProviderContentShape)

const sendMessageContentShape = {
  templateMetaId: z.string(),
  templateName: z.string(),
  userIds: z.string(),
  schedule: z.string(),
  securityLevel: z.nativeEnum(MessageSecurityLevel),
}
const baseSendMessageSchema = z.object(sendMessageContentShape)

export {
  messageTemplateContentShape,
  baseMessageTemplateSchema,
  baseEmailProviderSchema,
  emailProviderContentShape,
  sendMessageContentShape,
  baseSendMessageSchema,
}
