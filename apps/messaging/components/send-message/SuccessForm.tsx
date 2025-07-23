import {
  Button,
  Heading,
  Link,
  Paragraph,
  Stack,
  SummaryList,
  SummaryListRow,
  SummaryListValue,
  toaster,
} from "@govie-ds/react"
import { useAnalytics } from "@ogcio/nextjs-analytics"
import { MessageSecurityLevel } from "const/messaging"
import { useLocale, useTranslations } from "next-intl"
import { useContext, useEffect, useRef } from "react"
import { defaultFormGap, today, toIrishTime } from "utils/datetime"
import { SuccessBannerContainer } from "@/components/containers"
import { ANALYTICS } from "../../const/analytics"
import { SendMessageContext, SendMessageSteps } from "./SendMessageContext"

export default () => {
  const t = useTranslations("message.wizard.step.success")
  const locale = useLocale()
  const { message, setMessage, setStep } = useContext(SendMessageContext)
  const analyticsClient = useAnalytics()

  // biome-ignore lint/correctness/useExhaustiveDependencies: legacy
  useEffect(() => {
    analyticsClient.trackEvent({
      event: {
        name: ANALYTICS.message.stepComplete.name,
        category: ANALYTICS.message.category,
        action: ANALYTICS.message.stepComplete.action,
      },
    })
  }, [])

  const handleReset = () => {
    setMessage({
      excerpt: undefined,
      plainText: undefined,
      richText: undefined,
      schedule: undefined,
      securityLevel: MessageSecurityLevel.CONFIDENTIAL,
      subject: undefined,
      submittedAt: undefined,
      threadName: undefined,
      transports: [],
      userIds: [],
      templateMetaId: undefined,
      templateInterpolations: {},
      successfulMessagesCreated: 0,
    })
    setStep(SendMessageSteps.meta)
  }

  const messageFailedLock = useRef(false)
  useEffect(() => {
    if (
      !messageFailedLock.current &&
      message.successfulMessagesCreated !== message.userIds?.length
    ) {
      messageFailedLock.current = true
      toaster.create({
        title: "Some messages failed to send.",
        action: {
          href: `/${locale}/admin/message-events?status=failed`,
          label: "View Event Log",
        },
        duration: 10000,
        position: { x: "right", y: "top" },
        variant: "danger",
      })
    }
  }, [message, locale])

  const scheduledAt = message.schedule ? toIrishTime(message.schedule) : null
  return (
    <Stack direction='column' gap={defaultFormGap}>
      <SuccessBannerContainer>
        <Heading>{t("heading.main")}</Heading>
      </SuccessBannerContainer>

      <Heading as='h2'>{t("heading.secondary")}</Heading>
      <SummaryList>
        <SummaryListRow label={t("label.messageType")} withBorder>
          <SummaryListValue>{message.templateName}</SummaryListValue>
        </SummaryListRow>

        <SummaryListRow label={t("label.date")} withBorder>
          <SummaryListValue>{today()}</SummaryListValue>
        </SummaryListRow>

        <SummaryListRow label={t("label.recipients")} withBorder>
          <SummaryListValue>
            {message.successfulMessagesCreated || ""}
          </SummaryListValue>
        </SummaryListRow>

        <SummaryListRow label={t("label.status")} withBorder>
          <SummaryListValue>
            {scheduledAt
              ? t("list.scheduled", {
                  date: scheduledAt.format("DD/MM/YYYY"),
                  time: scheduledAt.format("HH:mm"),
                })
              : null}
          </SummaryListValue>
        </SummaryListRow>
      </SummaryList>

      <Stack direction='column' gap={defaultFormGap / 2}>
        <Paragraph>{t("paragraph.status")}</Paragraph>
        <Link
          href={`/${locale}/admin/message-events?dateFrom=${scheduledAt?.format("YYYY-MM-DD")}&dateTo=${scheduledAt?.format("YYYY-MM-DD")}`}
        >
          {t("link.eventLog")}
        </Link>
      </Stack>

      <Button type='button' onClick={handleReset}>
        {t("button.sendAnother")}
      </Button>
    </Stack>
  )
}
