import { Card, Heading, Paragraph, Stack } from "@govie-ds/react"
import { trackEvent } from "@ogcio/nextjs-analytics"
import { ANALYTICS } from "const/analytics"
import { getTranslations } from "next-intl/server"
import { defaultFormGap } from "utils/datetime"
import { redirectIfPublicServant } from "@/app/[locale]/home/redirectPublicServant"
import { BackLink } from "@/components/BackButton"
import { SecureEmailViewer } from "@/components/home/SecureEmailViewer"
import { BBClients } from "@/utils/building-blocks-sdk"
import loader from "./loader"
import { setMessageAsRead } from "./setMessageAsRead"

export default async (props: {
  params: { messageId: string; locale: string }
  searchParams?: { tab: "all" | "unread" }
}) => {
  await redirectIfPublicServant()

  const { locale } = props.params
  const { message, meta } = await loader({
    params: props.params,
    searchParams: props.searchParams,
  })

  if (message.error) {
    throw message.error
  }

  const t = await getTranslations("home")
  await setMessageAsRead(props.params.messageId)

  trackEvent(BBClients.getAnalyticsClient())({
    event: {
      name: ANALYTICS.message.detail.name,
      category: ANALYTICS.message.category,
      action: ANALYTICS.message.detail.action,
    },
  })

  const richText =
    message?.data && "richText" in message.data && message.data.richText
      ? message.data.richText
      : undefined
  const plainText =
    message?.data && "plainText" in message.data && message.data.plainText
      ? message.data.plainText
      : undefined
  const subject =
    message?.data && "subject" in message.data && message.data.subject
      ? message.data.subject
      : ""

  const backSearchQuery = new URLSearchParams(props.searchParams).toString()

  return (
    <Stack direction='column' gap={defaultFormGap}>
      <Heading>{subject}</Heading>
      {richText ? (
        <SecureEmailViewer emailContent={richText} />
      ) : (
        <Paragraph whitespace='pre-wrap' size='md'>
          {plainText}
        </Paragraph>
      )}

      {meta?.length ? (
        <Stack direction='column' gap={2}>
          {meta?.map((meta) => (
            <Card
              key={meta.id}
              type='horizontal'
              title={meta.fileName}
              titleAsChild
              subTitle={`${Math.round(meta.fileSize / 1024)} kb`}
              media={{
                type: "icon",
                config: {
                  icon: "download",
                  size: "xl",
                  className: "gi-text-gray-500",
                },
              }}
            >
              <a href={`/api/file/${meta.id}`} target='_blank' rel='noreferrer'>
                {meta.fileName}
              </a>
            </Card>
          ))}
        </Stack>
      ) : null}
      <BackLink
        href={`/${locale}/home${backSearchQuery ? `?${backSearchQuery}` : ""}`}
      >
        {t("button.back")}
      </BackLink>
    </Stack>
  )
}
