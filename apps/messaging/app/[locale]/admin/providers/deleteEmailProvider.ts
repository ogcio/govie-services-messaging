"use server"
import { BBClients } from "@/utils/building-blocks-sdk"

export async function handleDeleteAction(
  prev: { error?: string; deletedId: string },
  formData: FormData,
) {
  const id = formData.get("id") as string

  const messaging = BBClients.getMessagingClient()
  const response = await messaging.deleteEmailProvider(id)

  if (response.error) {
    return { error: response.error.name, deletedId: prev.deletedId }
  }

  return { error: undefined, deletedId: id }
}
