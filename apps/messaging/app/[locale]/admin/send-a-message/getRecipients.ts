"use server"
import { getServerLogger } from "@ogcio/nextjs-logging-wrapper/server-logger"
import { BBClients } from "@/utils/building-blocks-sdk"

export async function getRecipients({
  queryParams,
}: {
  queryParams: {
    limit?: number
    offset?: number
    search?: string
    firstName?: string
    lastName?: string
    email?: string
  }
}) {
  const logger = getServerLogger("error")
  const profile = BBClients.getProfileClient()
  const response = await profile.listProfiles({
    limit: queryParams.limit ? String(queryParams.limit) : undefined,
    offset: queryParams.offset ? String(queryParams.offset) : undefined,
    search: queryParams.search,
    email: queryParams.email,
    firstName: queryParams.firstName,
    lastName: queryParams.lastName,
  })

  if (response.error) {
    logger.error(response.error)
    return { data: [], error: response.error.detail }
  }

  return { data: response.data, error: null, metadata: response.metadata }
}
