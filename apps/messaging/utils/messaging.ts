import type { Messaging } from "@ogcio/building-blocks-sdk/dist/types"
import { getCachedConfig } from "./env-config"

export const getLinks = (
  locale = "en",
): { feedbackLink: URL; learnMoreForm: URL } => {
  const { formsServiceUrl, feedbackFormId, learnMoreFormId } =
    getCachedConfig()()

  return {
    feedbackLink: new URL([locale, feedbackFormId].join("/"), formsServiceUrl),
    learnMoreForm: new URL(
      [locale, learnMoreFormId].join("/"),
      formsServiceUrl,
    ),
  }
}

/**
 * Checks for all values inside double curly brackets
 *
 * eg. {{value}} => ["value"]
 */
export function getInterpolationValues(text: string): string[] {
  return text.match(/[^{{]+(?=}})/g) || []
}

export function isStatus(
  status: unknown,
): status is Exclude<
  NonNullable<Parameters<Messaging["getMessageEvents"]>[0]>["status"],
  undefined
> {
  const check: Exclude<
    NonNullable<Parameters<Messaging["getMessageEvents"]>[0]>["status"],
    undefined
  >[] = ["delivered", "failed", "opened", "scheduled"]
  return check.some((c) => c === status)
}
