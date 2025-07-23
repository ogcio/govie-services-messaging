"use server"

import type { Messaging } from "@ogcio/building-blocks-sdk/dist/types"
import { BBClients } from "@/utils/building-blocks-sdk"

export async function getTemplates(
  filter?: Parameters<Awaited<Messaging["getTemplates"]>>[0],
) {
  const messaging = BBClients.getMessagingClient()
  const response = await messaging.getTemplates(filter)

  if (response.error) {
    throw response.error
  }

  return response.data
}
