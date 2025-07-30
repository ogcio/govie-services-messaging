"use client"

// biome-ignore assist/source/organizeImports: TODO
import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useContext,
  useState,
  useEffect,
} from "react"
import { ConsentStatuses, type ConsentStatus } from "./types"
import { ConsentModal } from "./ConsentModal"

const ConsentContext = createContext<{
  isConsentModalOpen: boolean
  setIsConsentModalOpen: Dispatch<SetStateAction<boolean>>
  profileId: string
  preferredLanguage: "en" | "ga"
}>({
  isConsentModalOpen: false,
  setIsConsentModalOpen: () => {},
  profileId: "",
  preferredLanguage: "en",
})

export const ConsentProvider = ({
  children,
  isPublicServant,
  consentStatus,
  profileId,
  preferredLanguage,
}: {
  children: React.ReactNode
  isPublicServant: boolean
  consentStatus: ConsentStatus
  profileId: string
  preferredLanguage: "en" | "ga"
}) => {
  const shouldShowModalToCitizen =
    !isPublicServant &&
    consentStatus !== ConsentStatuses.OptedIn &&
    consentStatus !== ConsentStatuses.PreApproved &&
    consentStatus !== ConsentStatuses.OptedOut

  console.log("ConsentProvider render:", {
    isPublicServant,
    consentStatus,
    shouldShowModalToCitizen,
    profileId,
  })

  const [isConsentModalOpen, setIsConsentModalOpen] = useState(
    shouldShowModalToCitizen,
  )

  // Reset modal state when shouldShowModalToCitizen changes (e.g., on navigation)
  useEffect(() => {
    console.log("ConsentProvider useEffect:", {
      shouldShowModalToCitizen,
      isConsentModalOpen,
    })
    setIsConsentModalOpen(shouldShowModalToCitizen)
  }, [shouldShowModalToCitizen, isConsentModalOpen])

  return (
    <ConsentContext.Provider
      value={{
        isConsentModalOpen,
        setIsConsentModalOpen,
        profileId,
        preferredLanguage,
      }}
    >
      <ConsentModal />
      {children}
    </ConsentContext.Provider>
  )
}

export const useConsent = () => {
  return useContext(ConsentContext)
}
