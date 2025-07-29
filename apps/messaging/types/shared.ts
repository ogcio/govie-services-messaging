import type { MessageSecurityLevel } from "const/messaging"

export const LANG_EN = "en"
export const LANG_GA = "ga"
export const AVAILABLE_LANGUAGES = [LANG_EN, LANG_GA]
export const DUBLIN_TIMEZONE = "Europe/Dublin"

export type FormError = {
  messageKey: string
  field: string
  errorValue: string
}

export type RecipientContact = {
  id: string
  emailAddress?: string
  phoneNumber?: string
  firstName: string
  lastName: string
}

export type AwsState = {
  name: string
  type: "AWS"
  accessKey: string
  secretAccessKey: string
  region: string
}

export type MessageState = {
  organisationId: string
  threadName: string
  securityLevel: MessageSecurityLevel
  subject: string
  excerpt: string
  richText: string
  plainText: string
  submittedAt: string
  transports: string[]
  schedule: string
  userIds: string[]
  templateMetaId: string
  templateName: string
  templateInterpolations: Record<string, string>
  successfulMessagesCreated: number
  errors?: Record<string, string>
}

export type EmailProvider = {
  id: string
  name: string
  host: string
  port: number
  username: string
  password: string
  throttle?: number
  fromAddress: string
}
