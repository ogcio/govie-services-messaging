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
  userConsentStatementId,
  events,
}: {
  children: React.ReactNode
  config: ConsentConfig
  userContext: ConsentUserContext
  consentStatus: ConsentStatus
  userConsentStatementId: string | null
  events?: ConsentEvents
}) => {
  const searchParams = useSearchParams()

  const shouldShowModal = config.shouldShowModal({
    userContext,
    consentStatus,
    searchParams,
    userConsentStatementId: userConsentStatementId,
    latestConsentStatementId: config.content.version.id,
  })

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
