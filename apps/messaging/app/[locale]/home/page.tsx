import { Heading, Stack } from "@govie-ds/react"
import { trackEvent } from "@ogcio/nextjs-analytics"
import { ANALYTICS } from "const/analytics"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getTranslations } from "next-intl/server"
import { defaultFormGap } from "utils/datetime"
import { MessageTable } from "@/components/home/MessageTable"
import { MessageTabs } from "@/components/home/MessageTabs"
import SearchBar from "@/components/home/SearchBar"
import { AuthenticationFactory } from "@/utils/authentication-factory"
import { BBClients } from "@/utils/building-blocks-sdk"
import { getCachedConfig } from "@/utils/env-config"
import {
  CustomHeaders,
  getLoginUrlWithCustomPostLoginRedirect,
} from "@/utils/logto-config"
import loader from "./loader"
import { redirectIfPublicServant } from "./redirectPublicServant"

export default async (props: {
  searchParams?: { tab?: string; search?: string; page?: number }
  params: { locale: string }
}) => {
  await redirectIfPublicServant()
  const { locale } = props.params
  const userContextHandler = AuthenticationFactory.getInstance()
  const isOnboarded = await userContextHandler.isCitizenOnboarded()
  if (!isOnboarded) {
    const config = getCachedConfig()()
    const h = headers()
    const source = h.get(CustomHeaders.Pathname)
    const redirectToSource = getLoginUrlWithCustomPostLoginRedirect(
      config.baseUrl,
      `${config.baseUrl}${source || ""}`,
    )
    redirect(
      `${config.profileUrl}/${locale}/onboarding?source=${encodeURIComponent(redirectToSource)}`,
    )
  }

  const t = await getTranslations("home")
  const messages = await loader({
    searchParams: {
      tab: props.searchParams?.tab as "all" | "unread",
      search: props.searchParams?.search,
      offset: props.searchParams?.page,
    },
  })

  if (messages.error) {
    throw messages.error
  }

  trackEvent(BBClients.getAnalyticsClient())({
    event: {
      name: ANALYTICS.message.listView.name,
      category: ANALYTICS.message.category,
      action: ANALYTICS.message.listView.action,
    },
  })

  return (
    <div className='twelve-column-layout'>
      <Stack
        direction='column'
        gap={defaultFormGap}
        className='two-thirds-col-span'
      >
        <Heading>{t("heading.main")}</Heading>
        <SearchBar />
        <MessageTabs />

        <MessageTable />
      </Stack>
    </div>
  )
}
