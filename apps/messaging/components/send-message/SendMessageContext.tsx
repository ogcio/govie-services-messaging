"use client"

import { MessageSecurityLevel } from "const/messaging"
import { createContext, useContext, useState } from "react"
import { UserContext } from "@/components/UserContext"
import type { MessageState } from "@/types/shared"
import { PROFILE_PUBLIC_SERVANT_ROLE } from "@/utils/env-config"
import ComposeMessageMeta from "./ComposeMessageMeta"
import Recipients from "./Recipients"
import ScheduleForm from "./ScheduleForm"
import SuccessForm from "./SuccessForm"

type SendMessageStep = {
  key: string
  // biome-ignore lint/suspicious/noExplicitAny: legacy
  component: any
  isValid: (message: MessageState) => boolean
  next: string | null
  previous: string | null
  props?: Record<string, unknown>
}

export const SendMessageSteps = {
  meta: {
    previous: null,
    key: "meta",
    component: ComposeMessageMeta,
    isValid: ({ templateMetaId }: Partial<MessageState>) =>
      Boolean(templateMetaId),
    next: "recipients",
  },
  recipients: {
    key: "recipients",
    component: Recipients,
    isValid: ({ userIds }: Partial<MessageState>) => Boolean(userIds?.length),
    next: "schedule",
    previous: "meta",
  },
  schedule: {
    key: "schedule",
    previous: "recipients",
    component: ScheduleForm,
    isValid: ({ schedule }: Partial<MessageState>) => Boolean(schedule),
    next: "success",
  },
  success: {
    key: "success",
    previous: null,
    component: SuccessForm,
    isValid: () => true,
    next: null,
  },
}

type SendMessageContextType = {
  userId: string
  canCreateProfiles: boolean
  searchParams: Record<string, string>
  message: Partial<MessageState>
  step: SendMessageStep
  errors: {
    api?: Record<string, { detail: string }>
    server?: string
  }
  setMessage: (message: SendMessageContextType["message"]) => void
  setSearchParams: (
    searchParams: SendMessageContextType["searchParams"],
  ) => void
  onStep: (
    message: SendMessageContextType["message"],
    d: "next" | "previous",
  ) => void
  setErrors: React.Dispatch<
    React.SetStateAction<SendMessageContextType["errors"]>
  >
  setStep: (step: SendMessageStep) => void
}

const SendMessageContext = createContext<SendMessageContextType>({
  userId: "",
  searchParams: {},
  canCreateProfiles: false,
  message: {},
  setMessage: () => {},
  setSearchParams: () => {},
  step: SendMessageSteps.meta,
  onStep: () => {},
  errors: {},
  setErrors: () => {},
  setStep: () => {},
})

const SendMessageProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useContext(UserContext)
  if (!user) {
    throw new Error("UserContext not found")
  }

  const [message, setMessage] = useState<SendMessageContextType["message"]>({
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

  const [step, setStep] = useState<SendMessageContextType["step"]>(
    SendMessageSteps.meta,
  )
  const [localSearchParams, setLocalSearchParams] = useState<
    SendMessageContextType["searchParams"]
  >({})
  const [errors, setErrors] = useState<SendMessageContextType["errors"]>({})

  const onStep = (
    updatedMessage: SendMessageContextType["message"],
    direction: "next" | "previous",
  ) => {
    // Preserve all existing message properties and merge with updates
    setMessage((prevMessage) => ({
      ...prevMessage,
      ...updatedMessage,
      submittedAt: direction === "next" ? new Date().toISOString() : "",
    }))

    const key = direction === "next" ? step.next : step.previous

    if (!key) {
      return
    }

    const nextStep = SendMessageSteps[key]
    nextStep && setStep(nextStep)
  }

  const canCreateProfiles =
    user.currentOrganization?.roles.includes(PROFILE_PUBLIC_SERVANT_ROLE) ??
    false

  return (
    <SendMessageContext.Provider
      value={{
        userId: user.id,
        canCreateProfiles,
        searchParams: localSearchParams,
        setSearchParams: setLocalSearchParams,
        message,
        setMessage,
        step,
        onStep,
        errors,
        setErrors,
        setStep,
      }}
    >
      {children}
    </SendMessageContext.Provider>
  )
}

export { SendMessageContext, SendMessageProvider }
