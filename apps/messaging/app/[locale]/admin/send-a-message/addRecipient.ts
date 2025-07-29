"use server"
import { getServerLogger } from "@ogcio/nextjs-logging-wrapper/server-logger"
import { BBClients } from "@/utils/building-blocks-sdk"

export async function addRecipient(params: {
  email: string
  firstName: string
  lastName: string
}) {
  const logger = getServerLogger("error")
  const profile = BBClients.getProfileClient()

  const response = await profile.createProfile(params)
  if (response.error) {
    logger.error(response.error)
    return { error: response.error.detail }
  }

  return { error: null }
}
