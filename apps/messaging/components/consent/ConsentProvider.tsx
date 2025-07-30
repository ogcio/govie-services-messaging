"use client"

// biome-ignore assist/source/organizeImports: TODO
import {
  createContext,
  type Dispatch,
  type SetStateAction,
  useContext,
  useState,
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
    consentStatus !== ConsentStatuses.PreApproved
  const [isConsentModalOpen, setIsConsentModalOpen] = useState(
    shouldShowModalToCitizen,
  )

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
