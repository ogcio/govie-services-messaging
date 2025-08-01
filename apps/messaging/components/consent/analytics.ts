export const CONSENT_CATEGORY = "consent"

export const CONSENT_ACTIONS = {
  ACCEPT: "accept",
  DECLINE: "decline",
}

export const ConsentAnalyticsEvent = ({
  name,
  action,
}: {
  name: string
  action: string
}) => ({
  event: {
    category: CONSENT_CATEGORY,
    action,
    name,
    value: 1,
  },
})
