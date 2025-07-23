"use server"
import { headers } from "next/headers"
import { BBClients } from "@/utils/building-blocks-sdk"

export async function getTemplatesAndLanguage() {
  const lang = headers().get("x-next-intl-locale")
  const { data: templates } =
    await BBClients.getMessagingClient().getTemplates()

  return {
    templates,
    lang,
  }
}
