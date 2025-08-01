"use server"
import {
  getMessageTemplateContentSchema,
  getMessageTemplateSchema,
} from "@/types/schemas-server"
import type {
  MessageTemplatePayload,
  MessageTemplatePayloadError,
} from "@/types/types"
import { createOrUpdateTemplate } from "./createOrUpdateTemplate"

export async function createOrUpdateTemplateAction(
  _prevState: { errors: Record<string, MessageTemplatePayloadError> },
  formData: FormData,
) {
  const messageTemplateSchema = await getMessageTemplateSchema()
  const messageTemplateFields = messageTemplateSchema.safeParse({
    languages: formData.get("languages")?.toString().split(","),
    templateId: formData.get("templateId")?.toString(),
  })

  if (!messageTemplateFields.success) {
    return { errors: messageTemplateFields.error.flatten().fieldErrors }
  }

  const { languages, templateId } = messageTemplateFields.data

  const messageTemplateContentSchema = await getMessageTemplateContentSchema()

  const contents: MessageTemplatePayload[] = []

  const errors: Record<string, MessageTemplatePayloadError> = {}

  for (const language of languages) {
    const { success, data, error } = messageTemplateContentSchema.safeParse({
      templateName: formData.get(`${language}_templateName`)?.toString(),
      richText: formData.get(`${language}_richText`)?.toString(),
      plainText: formData.get(`${language}_plainText`)?.toString(),
      subject: formData.get(`${language}_subject`)?.toString(),
    })

    if (!success) {
      errors[language] = error.flatten().fieldErrors
      continue
    }

    const { templateName, richText, plainText, subject } = data

    contents.push({
      language,
      richText,
      plainText,
      subject,
      templateName,
    })
  }

  if (Object.keys(errors).length) {
    return { errors }
  }

  return await createOrUpdateTemplate({
    templateId,
    contents,
  })
}
