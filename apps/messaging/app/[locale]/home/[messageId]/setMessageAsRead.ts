import { getCommonLogger } from "@ogcio/nextjs-logging-wrapper/common-logger"
import { BBClients } from "@/utils/building-blocks-sdk"

export const setMessageAsRead = async (messageId: string) => {
  try {
    const messagingSdk = BBClients.getMessagingClient()
    await messagingSdk.seeMessage(messageId)
  } catch (error) {
    const logger = getCommonLogger("error")
    logger.error("failed to set message as read", error)
  }
}
