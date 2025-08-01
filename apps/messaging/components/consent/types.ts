export const ConsentStatuses = {
  Pending: "pending",
  Undefined: "undefined",
  PreApproved: "pre-approved",
  OptedOut: "opted-out",
  OptedIn: "opted-in",
} as const
export type ConsentStatus =
  (typeof ConsentStatuses)[keyof typeof ConsentStatuses]
