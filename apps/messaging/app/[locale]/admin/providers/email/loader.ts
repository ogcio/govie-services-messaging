"use server"
import { BBClients } from "@/utils/building-blocks-sdk"

export default async (id: string) => {
  const client = BBClients.getMessagingClient()
  const { data, error } = await client.getEmailProvider(id)

  if (error || !data) {
    return {
      errors: { api: error?.detail || "No data found" },
    }
  }

  return data
}
