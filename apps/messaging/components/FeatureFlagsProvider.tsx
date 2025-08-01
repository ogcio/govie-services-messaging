"use client"

import { createContext, useContext } from "react"

export const FeatureFlagsContext = createContext<{
  isConsentEnabled: boolean
}>({
  isConsentEnabled: false,
})

// Extend this with any other feature flags that are needed
export const FeatureFlagsProvider = ({
  children,
  isConsentEnabled,
}: {
  children: React.ReactNode
  isConsentEnabled: boolean
}) => {
  return (
    <FeatureFlagsContext.Provider value={{ isConsentEnabled }}>
      {children}
    </FeatureFlagsContext.Provider>
  )
}

export const useFeatureFlags = () => {
  return useContext(FeatureFlagsContext)
}
