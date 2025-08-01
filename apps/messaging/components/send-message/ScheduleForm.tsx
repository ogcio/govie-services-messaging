import {
  Button,
  FormField,
  Heading,
  Paragraph,
  Radio,
  Spinner,
  Stack,
  TextInput,
  toaster,
} from "@govie-ds/react"
import { useAnalytics } from "@ogcio/nextjs-analytics"
import { useTranslations } from "next-intl"
import { type PropsWithChildren, useContext, useEffect, useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { buildSchedule, defaultFormGap, today } from "utils/datetime"
import sendMessageAction from "@/app/[locale]/admin/send-a-message/action"
import { BackButton } from "@/components/BackButton"
import { ANALYTICS } from "@/const/analytics"
import { SendMessageContext } from "./SendMessageContext"

function ButtonWithFormStatus(props: PropsWithChildren) {
  const status = useFormStatus()

  return (
    <Button disabled={status.pending} type='submit'>
      {props.children}
      {status.pending && <Spinner />}
    </Button>
  )
}

export default () => {
  const t = useTranslations("message.wizard.step.schedule")
  const [dateTimeErrors, setDateTimeErrors] = useState<{
    date?: string
    time?: string
  }>({})
  const { message, onStep } = useContext(SendMessageContext)
  const [state, formAction] = useFormState(sendMessageAction, undefined)
  const [selectedSchedule, setSelectedSchedule] = useState("now")
  const analyticsClient = useAnalytics()

  useEffect(() => {
    analyticsClient.trackEvent({
      event: {
        name: ANALYTICS.message.stepSchedule.name,
        category: ANALYTICS.message.category,
        action: ANALYTICS.message.stepSchedule.action,
      },
    })
  }, [analyticsClient.trackEvent])

  useEffect(() => {
    if (state?.created === 0 && state?.errors) {
      toaster.create({
        title: t("toaster.title.serverError"),
        position: { x: "right", y: "top" },
        variant: "danger",
      })
    }
  }, [state?.created, state?.errors, t])

  useEffect(() => {
    if ((state?.created ?? 0) > 0) {
      onStep(
        {
          ...message,
          schedule: state?.schedule,
          successfulMessagesCreated: state?.created,
        },
        "next",
      )
    }
  }, [state?.created, state?.schedule, onStep, message])

  return (
    <form
      noValidate
      action={(formData) => {
        const { templateMetaId, userIds, templateName, securityLevel } = message

        if (!templateMetaId || !userIds || !securityLevel) return

        const date = formData.get("scheduleDate") as string
        const time = formData.get("scheduleTime") as string
        setDateTimeErrors({})

        if (selectedSchedule === "future" && !date) {
          setDateTimeErrors({ date: t("input.error.date") })
          return
        }

        if (selectedSchedule === "future" && !time) {
          setDateTimeErrors({ time: t("input.error.time") })
          return
        }

        const schedule =
          selectedSchedule === "now"
            ? buildSchedule()
            : buildSchedule(date, time)
        formData.set("templateMetaId", templateMetaId)
        formData.set("templateName", templateName || "")
        formData.set("userIds", userIds.join(","))
        formData.set("schedule", schedule)
        formData.set("securityLevel", securityLevel)
        formAction(formData)
      }}
    >
      <Stack direction='column' gap={defaultFormGap}>
        <Heading>{t("heading.main")}</Heading>
        <Paragraph>{t("hint.main")}</Paragraph>

        <Stack direction='row' gap={defaultFormGap}>
          <Radio
            name='scheduleWhen'
            id='now'
            value='now'
            label={t("label.now")}
            onChange={() => setSelectedSchedule("now")}
            checked={selectedSchedule === "now"}
          />

          <Radio
            name='scheduleWhen'
            id='future'
            value='future'
            label={t("label.later")}
            checked={selectedSchedule === "future"}
            onChange={() => setSelectedSchedule("future")}
          />
        </Stack>

        <Stack direction='row' gap={6}>
          <FormField
            error={
              dateTimeErrors.date ? { text: dateTimeErrors.date } : undefined
            }
            label={{ text: "Date", htmlFor: "scheduleDate" }}
          >
            <TextInput
              id='scheduleDate'
              name='scheduleDate'
              type='date'
              disabled={selectedSchedule !== "future"}
              onChange={() => {
                if (dateTimeErrors.date) {
                  setDateTimeErrors({})
                }
              }}
              min={today()}
            />
          </FormField>
          <FormField
            error={
              dateTimeErrors.time ? { text: dateTimeErrors.time } : undefined
            }
            label={{ text: "Time", htmlFor: "scheduleTime" }}
          >
            <TextInput
              id='scheduleTime'
              name='scheduleTime'
              type='time'
              disabled={selectedSchedule !== "future"}
              onChange={() => {
                if (dateTimeErrors.time) {
                  setDateTimeErrors({})
                }
              }}
            />
          </FormField>
        </Stack>

        <ButtonWithFormStatus>{t("button.submit")}</ButtonWithFormStatus>

        <BackButton
          onClick={() => {
            onStep(message, "previous")
          }}
        >
          {t("button.back")}
        </BackButton>
      </Stack>
    </form>
  )
}
