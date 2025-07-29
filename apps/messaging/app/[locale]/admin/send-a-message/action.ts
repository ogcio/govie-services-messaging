"use server"
import { getSendMessageSchema } from "@/types/schemas-server"
import type { SendMessagePayloadError } from "@/types/types"
import { createMessages } from "./createMessages"

export default async function action(
  _prevState:
    | { created?: number; errors?: SendMessagePayloadError; schedule?: string }
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
      errors: sendMessageFields.error.flatten().fieldErrors,
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
