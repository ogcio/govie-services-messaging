"use server"
import { getSendMessageSchema } from "@/types/schemas"
import { createMessages } from "./createMessages"

export default async function action(
  _prevState:
    | { created?: number; errors?: Record<string, string>; schedule?: string }
    | undefined,
  formData: FormData,
) {
  const sendMessageSchema = await getSendMessageSchema()
  const sendMessageFields = sendMessageSchema.safeParse(
    Object.fromEntries(formData),
  )

  if (!sendMessageFields.success) {
    return {
      created: 0,
      errors: Object.fromEntries(
        Object.entries(sendMessageFields.error.flatten().fieldErrors).map(
          ([key, value]) => [key, value?.[0] || "Invalid field"],
        ),
      ),
    }
  }
  const { created, errors } = await createMessages(sendMessageFields.data)
  const schedule = formData.get("schedule")?.toString() || ""

  return {
    created,
    errors,
    schedule,
  }
}
