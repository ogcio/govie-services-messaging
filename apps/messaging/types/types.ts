import type { ZodError, z } from "zod"
import type { getMessageTemplateContentSchema } from "@/types/schemas-server"
import { LANG_EN, LANG_GA } from "@/types/shared"
import type { BBClients } from "@/utils/building-blocks-sdk"
import type {
  baseEmailProviderSchema,
  baseMessageTemplateSchema,
} from "./schemas"

// helper type for zod errors
type FieldErrorsOf<T extends z.ZodTypeAny> = ReturnType<
  ZodError<z.infer<T>>["flatten"]
>["fieldErrors"]

type MessageTemplateContentSchema = Awaited<
  ReturnType<typeof getMessageTemplateContentSchema>
>
type MessageTemplateContent = z.infer<MessageTemplateContentSchema>

type MessageTemplatePayload = {
  language: string
  richText?: string
} & MessageTemplateContent

type MessageTemplateFormData = {
  templateId: string | undefined
  languages: string[]
  [LANG_EN]?: MessageTemplateContent
  [LANG_GA]?: MessageTemplateContent
}

type MessageTemplatePayloadError = FieldErrorsOf<
  typeof baseMessageTemplateSchema
>
type EmailProviderPayloadError = FieldErrorsOf<typeof baseEmailProviderSchema>

type EmailProviderApiPayload = Awaited<
  ReturnType<
    Awaited<
      ReturnType<(typeof BBClients)["getMessagingClient"]>["getEmailProvider"]
    >
  >
>["data"]

export type {
  MessageTemplateFormData,
  MessageTemplatePayload,
  MessageTemplatePayloadError,
  EmailProviderPayloadError,
  EmailProviderApiPayload,
}

export type AppUser = {
  id: string
  isPublicServant: boolean
  isInactivePublicServant: boolean
  name?: string
  currentOrganization?: { name: string; id: string; roles: string[] }
  organizations?: { name: string; id: string; roles: string[] }[]
}
