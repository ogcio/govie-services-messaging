import { cleanUrl } from "./clean-url"

function buildClientUrlWithSearchParams({
  dir,
  locale,
  searchParams,
}: {
  locale?: string | null
  dir: string
  searchParams: { [key: string]: string | string[] } | undefined
}): URL {
  const url = buildClientUrl({ locale, url: dir })
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (Array.isArray(value)) {
        for (const v of value) {
          url.searchParams.append(key, v)
        }
      } else {
        url.searchParams.append(key, value)
      }
    }
  }
  return url
}

function buildClientUrl({
  locale,
  url,
}: {
  locale?: string | null
  url: string | null
}) {
  const path = [cleanUrl(locale), cleanUrl(url)].join("/")
  try {
    return new URL(path, process.env.NEXT_PUBLIC_MESSAGING_SERVICE_ENTRY_POINT)
  } catch (e) {
    console.warn("Failed to build client URL", e)
    throw new Error("Failed to build client URL")
  }
}

export { buildClientUrlWithSearchParams, buildClientUrl }
