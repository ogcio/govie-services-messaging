import { AuthenticationRoutes } from "@ogcio/nextjs-auth"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { NextRequest } from "next/server"
import {
  getSignInConfiguration,
  postLoginRedirectUrlCookieName,
} from "utils/logto-config"

const DEFAULT_POST_LOGIN_REDIRECT_URL = "/"

export async function GET(request: NextRequest) {
  await AuthenticationRoutes.loginCallback(
    getSignInConfiguration(),
    request.nextUrl.searchParams,
  )

  const postRedirectUrl = cookies().get(postLoginRedirectUrlCookieName)?.value
  if (postRedirectUrl) {
    cookies().delete(postLoginRedirectUrlCookieName)
  }

  redirect(
    postRedirectUrl && postRedirectUrl.trim().length > 0
      ? decodeURIComponent(postRedirectUrl)
      : DEFAULT_POST_LOGIN_REDIRECT_URL,
  )
}
