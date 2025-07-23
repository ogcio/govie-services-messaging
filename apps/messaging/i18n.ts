import { notFound } from "next/navigation"
import { getRequestConfig } from "next-intl/server"

const locales = ["en", "ga"]

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale

  // Validate that the incoming `locale` parameter is valid
  // biome-ignore lint/suspicious/noExplicitAny: needed
  if (!locales.includes(locale as any)) notFound()

  const applicationMessages = (await import(`./messages/${locale}.json`))
    .default

  return {
    locale,
    messages: {
      ...applicationMessages,
    },
  }
})
