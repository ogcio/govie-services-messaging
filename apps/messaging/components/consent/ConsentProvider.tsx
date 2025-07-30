"use client"

// biome-ignore assist/source/organizeImports: TODO
import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useContext,
  useState,
  Suspense,
} from "react"
import { ConsentStatuses, type ConsentStatus } from "./types"
import { ConsentModal } from "./ConsentModal"
import { useSearchParams } from "next/navigation"
import { LANG_EN, type LANG_GA } from "@/types/shared"

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
  isConsentEnabled,
}: {
  children: React.ReactNode
  isPublicServant: boolean
  consentStatus: ConsentStatus
  preferredLanguage: typeof LANG_EN | typeof LANG_GA
  isConsentEnabled: boolean
}) => {
  const hasValidConsent =
    consentStatus === ConsentStatuses.OptedIn ||
    consentStatus === ConsentStatuses.PreApproved ||
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
