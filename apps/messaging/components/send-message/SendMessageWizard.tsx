"use client"

import { ProgressStepper, Stack, StepItem } from "@govie-ds/react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useContext } from "react"
import { defaultFormGap } from "@/utils/datetime"
import { SendMessageContext, SendMessageSteps } from "./SendMessageContext"

const stepMap: Record<keyof typeof SendMessageSteps, number> = {
  meta: 0,
  recipients: 1,
  schedule: 2,
  success: 4,
}

const SendMessageWizard = () => {
  const t = useTranslations("message.wizard.step")
  const { step, setStep } = useContext(SendMessageContext)
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  if (searchParams.get("step") === "recipients") {
    setStep(SendMessageSteps.recipients)
    router.replace(pathname)
    return null
  }

  return (
    <Stack direction='column' gap={defaultFormGap}>
      <ProgressStepper currentStepIndex={stepMap[step.key]} indicator='number'>
        <StepItem label={t("meta.label.progress")} />
        <StepItem label={t("recipient.label.progress")} />
        <StepItem label={t("schedule.label.progress")} />
        <StepItem label={t("success.label.progress")} />
      </ProgressStepper>
      <step.component />
    </Stack>
  )
}

export { SendMessageWizard }
