"use server"
import { MessageSecurityLevel } from "const/messaging"
import { getTranslations } from "next-intl/server"
import { z } from "zod"

const getMessageTemplateSchema = async () => {
  await getTranslations("formErrors.messageTemplate")

  return z.object({
    languages: z.array(z.string()),
    templateId: z.string().optional(),
  })
}

const getMessageTemplateContentSchema = async () => {
  const t = await getTranslations("formErrors.messageTemplate")

  return z.object({
    templateName: z.string().min(1, { message: t("templateName") }),
    richText: z.string(),
    plainText: z.string().min(1, { message: t("plainText") }),
    subject: z.string().min(1, { message: t("subject") }),
  })
}

const getEmailProviderSchema = async () => {
  const t = await getTranslations("formErrors.emailProvider")

  return z.object({
    id: z.string().optional(),
    providerName: z.string().min(1, { message: t("name") }),
    smtpHost: z.string().min(1, { message: t("host") }),
    smtpPort: z.number().min(1, { message: t("port") }),
    username: z.string().min(1, { message: t("username") }),
    password: z.string().min(1, { message: t("password") }),
    fromAddress: z
      .string()
      .min(1, { message: t("fromAddress") })
      .email(t("invalidEmail")),
    throttle: z.number().optional(),
    ssl: z.boolean().default(false),
    isPrimary: z.boolean().default(false),
  })
}

const getSendMessageSchema = async () => {
  const t = await getTranslations("formErrors.fields")

  return z.object({
    templateMetaId: z.string({
      required_error: t("templateMetaId"),
    }),
    templateName: z.string({
      required_error: t("templateName"),
    }),
    userIds: z
      .string()
      .transform((val) => val.split(","))
      .pipe(
        z.array(z.string()).min(1, {
          message: t("recipients"),
        }),
      ),
    schedule: z.string({
      required_error: t("schedule"),
    }),
    securityLevel: z.nativeEnum(MessageSecurityLevel),
  })
}

export {
  getEmailProviderSchema,
  getMessageTemplateContentSchema,
  getMessageTemplateSchema,
  getSendMessageSchema,
}
