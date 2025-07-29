import { cleanUrl } from "./clean-url"
import { getCachedConfig } from "./env-config"
import { getCommonLoggerWithEnvLevel } from "./logging"

function buildServerUrlWithSearchParams({
  dir,
  locale,
  searchParams,
}: {
  locale?: string | null
  dir: string
  searchParams: Record<string, string>
}): URL {
  const url = buildServerUrl({ locale, url: dir })
  for (const [key, value] of Object.entries(searchParams)) {
    url.searchParams.append(key, value)
  }
  return url
}

function buildServerUrl({
  locale,
  url,
}: {
  locale?: string | null
  url: string | null
}) {
  const path = [cleanUrl(locale), cleanUrl(url)].join("/")
  const { baseUrl } = getCachedConfig()()
  try {
    return new URL(path, baseUrl)
  } catch {
    getCommonLoggerWithEnvLevel().warn(
      {
        path,
        baseUrl,
      },
      "Failed to build server URL",
    )
    throw new Error("Failed to build server URL")
  }
}

export { buildServerUrlWithSearchParams, buildServerUrl }
