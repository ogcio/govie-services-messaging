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

export {
  messageTemplateContentShape,
  baseMessageTemplateSchema,
  baseEmailProviderSchema,
  emailProviderContentShape,
}
