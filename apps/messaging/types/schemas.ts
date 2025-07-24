import z from "zod"

const messageTemplateContentShape = {
  templateName: z.string(),
  richText: z.string(),
  plainText: z.string(),
  subject: z.string(),
}

const baseMessageTemplateSchema = z.object(messageTemplateContentShape)

export { messageTemplateContentShape, baseMessageTemplateSchema }
