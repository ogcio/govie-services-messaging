"use server"

import { BBClients } from "@/utils/building-blocks-sdk"

export async function handleDeleteAction(_prev: unknown, formData: FormData) {
  "use server"

  const id = formData.get("id") as string

  const client = BBClients.getMessagingClient()
  const { error } = await client.deleteTemplate(id)

  if (error) {
    return { error }
  }

  return { deletedId: id }
}
