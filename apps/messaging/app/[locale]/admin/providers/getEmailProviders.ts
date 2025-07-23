"use server"

import type { PaginationParams } from "@ogcio/building-blocks-sdk/dist/client/utils/client-utils"
import { BBClients } from "@/utils/building-blocks-sdk"

export async function getEmailProviders(filter?: PaginationParams) {
  const messaging = BBClients.getMessagingClient()
  const response = await messaging.getEmailProviders(filter)

  if (response.error) {
    throw response.error
  }

  return response.data || []
}
