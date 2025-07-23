"use server"

import { BBClients } from "@/utils/building-blocks-sdk"

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export async function handleDeleteAction(prev: any, formData: FormData) {
  "use server"

  const id = formData.get("id") as string

  const client = BBClients.getMessagingClient()
  const { error } = await client.deleteTemplate(id)

  if (error) {
    return { error }
  }

  return { deletedId: id }
}
