"use server"
import { getTranslations } from "next-intl/server"
import { getEmailProviderSchema } from "@/types/schemas-server"
import type { EmailProviderPayloadError } from "@/types/types"
import { createOrUpdateEmailProvider } from "./createOrUpdateEmailProvider"

export default async function action(
  _prevState:
    | { errors?: EmailProviderPayloadError & { server?: string }; id?: string }
    | undefined,
  formData: FormData,
) {
  const t = await getTranslations("settings.EmailProvider")
  const emailProviderSchema = await getEmailProviderSchema()
  const emailProviderFields = emailProviderSchema.safeParse({
    id: formData.get("id")?.toString(),
    providerName: formData.get("providerName")?.toString(),
    smtpHost: formData.get("smtpHost")?.toString(),
    smtpPort: Number(formData.get("smtpPort")?.toString()),
    username: formData.get("username")?.toString(),
    password: formData.get("password")?.toString(),
    fromAddress: formData.get("fromAddress")?.toString(),
    throttle: Number(formData.get("throttle")?.toString()) || undefined,
    ssl: Boolean(formData.get("ssl")),
    isPrimary: Boolean(formData.get("isPrimary")),
  })

  if (!emailProviderFields.success) {
    const errors = emailProviderFields.error.flatten().fieldErrors
    return { errors }
  }

  const { errors, id } = await createOrUpdateEmailProvider({
    provider: {
      ...emailProviderFields.data,
      type: "email",
    },
    locale: "en",
  })

  if (errors || !id) {
    return { errors: { server: t("error.server") } }
  }

  return { id }
}
