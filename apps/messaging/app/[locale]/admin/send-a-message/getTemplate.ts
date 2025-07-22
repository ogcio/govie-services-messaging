"use server"
import { headers } from "next/headers"
import { BBClients } from "@/utils/building-blocks-sdk"

export async function getTemplate(templateMetaId: string) {
  const messaging = BBClients.getMessagingClient()
  const response = await messaging.getTemplate(templateMetaId)

  if (response.error) {
    throw response.error
  }

  const currentLocale = headers().get("x-next-intl-locale")
  const localeMatchContent = response.data.contents.find(
    (c) => c.language === currentLocale,
  )

  if (localeMatchContent) {
    return localeMatchContent
  }

  return response.data.contents.at(0)
}
