import { cookies } from "next/headers"
import type { NextRequest } from "next/server"
import createMiddleware from "next-intl/middleware"
import { CustomHeaders } from "./utils/logto-config"

const locales = ["en", "ga"]
const DEFAULT_LOCALE = "en"
const NEXT_LOCALE_COOKIE = "NEXT_LOCALE"

export default async function (request: NextRequest) {
  const preferredLanguage = cookies().has(NEXT_LOCALE_COOKIE)
    ? cookies().get(NEXT_LOCALE_COOKIE)?.value
    : DEFAULT_LOCALE

  const response = createMiddleware({
    locales,
    defaultLocale: preferredLanguage ?? DEFAULT_LOCALE,
  })(request)

  response.headers.append(CustomHeaders.Pathname, request.nextUrl.pathname)
  response.headers.append(CustomHeaders.Search, request.nextUrl.search)

  return response
}

export const config = {
  matcher: ["/((?!static|health|api|_next/static|_next/image|favicon.ico).*)"],
}
