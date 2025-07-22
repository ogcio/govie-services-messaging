import type { z } from "zod"
import type { getMessageTemplateContentSchema } from "@/types/schemas"
import { LANG_EN, LANG_GA } from "@/types/shared"

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

export type { MessageTemplateFormData, MessageTemplatePayload }

export type AppUser = {
  id: string
  isPublicServant: boolean
  isInactivePublicServant: boolean
  name?: string
  currentOrganization?: { name: string; id: string; roles: string[] }
  organizations?: { name: string; id: string; roles: string[] }[]
}
