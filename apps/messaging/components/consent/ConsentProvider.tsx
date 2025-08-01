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
import { useFeatureFlags } from "@/components/FeatureFlagsProvider"
import { LANG_EN, type LANG_GA } from "@/types/shared"
import { ConsentModal } from "./ConsentModal"
import { type ConsentStatus, ConsentStatuses } from "./types"

const ConsentContext = createContext<{
  isConsentModalOpen: boolean
  setIsConsentModalOpen: Dispatch<SetStateAction<boolean>>
  preferredLanguage: typeof LANG_EN | typeof LANG_GA
  isOptedOut: boolean
}>({
  isConsentModalOpen: false,
  setIsConsentModalOpen: () => {},
  preferredLanguage: LANG_EN,
  isOptedOut: false,
})

export const ConsentProvider = ({
  children,
  isPublicServant,
  consentStatus,
  preferredLanguage,
}: {
  children: React.ReactNode
  isPublicServant: boolean
  consentStatus: ConsentStatus
  preferredLanguage: typeof LANG_EN | typeof LANG_GA
}) => {
  const { isConsentEnabled } = useFeatureFlags()
  const hasValidConsent =
    consentStatus === ConsentStatuses.OptedIn ||
    consentStatus === ConsentStatuses.OptedOut
  const searchParams = useSearchParams()
  const shouldForceShowModal = searchParams.get("force-consent") === "1"
  const shouldShowModalToCitizen =
    !isPublicServant &&
    isConsentEnabled &&
    (!hasValidConsent || shouldForceShowModal)

  const [isConsentModalOpen, setIsConsentModalOpen] = useState(
    shouldShowModalToCitizen,
  )

  return (
    <Suspense>
      <ConsentContext.Provider
        value={{
          isConsentModalOpen,
          setIsConsentModalOpen,
          preferredLanguage,
          isOptedOut: consentStatus === ConsentStatuses.OptedOut,
        }}
      >
        <ConsentModal />
        {children}
      </ConsentContext.Provider>
    </Suspense>
  )
}

export const useConsent = () => {
  return useContext(ConsentContext)
}
