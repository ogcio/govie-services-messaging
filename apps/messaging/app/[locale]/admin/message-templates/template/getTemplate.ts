import { BBClients } from "@/utils/building-blocks-sdk"

export const getTemplate = async (id: string) => {
  const client = BBClients.getMessagingClient()
  const { data, error } = await client.getTemplate(id)

  if (error || !data) {
    return {
      errors: { api: error?.detail || "No data found" },
    }
  }

  return data
}
