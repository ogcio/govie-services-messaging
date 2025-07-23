"use server"
import { getEmailProviderSchema } from "@/types/schemas"
import { createOrUpdateEmailProvider } from "./createOrUpdateEmailProvider"

export default async function action(
  // biome-ignore lint/suspicious/noExplicitAny: legacy
  _prevState: { errors: Record<string, any>; id?: string } | undefined,
  formData: FormData,
) {
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
    const errors: Record<string, string> = {}
    const fieldErrors = emailProviderFields.error.flatten().fieldErrors
    for (const key of Object.keys(fieldErrors)) {
      errors[key] = fieldErrors[key].at(0)
    }
    return { errors }
  }

  return await createOrUpdateEmailProvider({
    provider: {
      ...emailProviderFields.data,
      type: "email",
    },
    locale: "en",
  })
}
