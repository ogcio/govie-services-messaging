"use client"

import { useSearchParams } from "next/navigation"
import {
  createContext,
  type Dispatch,
  type SetStateAction,
  Suspense,
  useContext,
  useState,
} from "react"
import { ConsentModal } from "./ConsentModal"
import {
  type ConsentConfig,
  type ConsentEvents,
  type ConsentStatus,
  ConsentStatuses,
  type ConsentUserContext,
} from "./types"

interface ConsentContextValue {
  isConsentModalOpen: boolean
  setIsConsentModalOpen: Dispatch<SetStateAction<boolean>>
  config: ConsentConfig
  userContext: ConsentUserContext
  isOptedOut: boolean
  events?: ConsentEvents
}

const ConsentContext = createContext<ConsentContextValue>({
  isConsentModalOpen: false,
  setIsConsentModalOpen: () => {},
  config: {} as ConsentConfig,
  userContext: {} as ConsentUserContext,
  isOptedOut: false,
})

export const ConsentProvider = ({
  children,
  config,
  userContext,
  consentStatus,
  events,
}: {
  children: React.ReactNode
  config: ConsentConfig
  userContext: ConsentUserContext
  consentStatus: ConsentStatus
  events?: ConsentEvents
}) => {
  const hasValidConsent =
    consentStatus === ConsentStatuses.OptedIn ||
    consentStatus === ConsentStatuses.OptedOut

  const searchParams = useSearchParams()
  const forceModalParam = config.forceModalParam || "force-consent"
  const shouldForceShowModal = searchParams.get(forceModalParam) === "1"

  const isFeatureEnabled = config.featureFlags?.isEnabled() ?? true

  const shouldShowModal =
    config.userContext.shouldShowModal(
      userContext,
      consentStatus,
      isFeatureEnabled,
    ) &&
    (!hasValidConsent || shouldForceShowModal)

  const [isConsentModalOpen, setIsConsentModalOpen] = useState(shouldShowModal)

  const contextValue: ConsentContextValue = {
    isConsentModalOpen,
    setIsConsentModalOpen,
    config,
    userContext,
    isOptedOut: consentStatus === ConsentStatuses.OptedOut,
    events,
  }

  return (
    <Suspense>
      <ConsentContext.Provider value={contextValue}>
        <ConsentModal />
        {children}
      </ConsentContext.Provider>
    </Suspense>
  )
}

export const useConsent = () => {
  return useContext(ConsentContext)
}
