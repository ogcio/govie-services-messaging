import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import type { NextRequest } from "next/server"
import { getCachedConfig } from "@/utils/env-config"
import {
  PostLoginSearchParams,
  postLoginRedirectUrlCookieName,
  socialConnectorIdCookieName,
} from "@/utils/logto-config"

const FIVE_MINUTES = 5 * 60 * 1000
const connectors = {
  mygovid: "mygovid",
  entraid: "ogcio-entraid",
}

export async function GET(request: NextRequest) {
  const loginUrl = request.nextUrl.searchParams.get(
    PostLoginSearchParams.LoginUrl,
  )
  const postLoginRedirectPath = request.nextUrl.searchParams.get(
    PostLoginSearchParams.PostLoginRedirectPath,
  )

  const { baseUrl, useGovIdOnly, isProductionEnv, cookieDomain } =
    getCachedConfig()()

  const isLocal = Boolean(baseUrl.includes("localhost"))

  const skipAdminConnectorLocally = isLocal && useGovIdOnly && !isProductionEnv

  let connectorId = connectors.mygovid
  if (request.nextUrl.searchParams.get("admin") && !skipAdminConnectorLocally) {
    connectorId = connectors.entraid
  }

  cookies().set(socialConnectorIdCookieName, connectorId, {
    secure: isProductionEnv || !isLocal,
    domain: cookieDomain || undefined,
    path: "/",
    sameSite: isLocal && !isProductionEnv ? "lax" : "none",
    expires: Date.now() + 1000 * 30,
  })

  // We need to perform this operation in a route since RSC doesn't allow us to set cookies directly
  if (postLoginRedirectPath && postLoginRedirectPath.trim().length > 0) {
    cookies().set(postLoginRedirectUrlCookieName, postLoginRedirectPath, {
      expires: Date.now() + FIVE_MINUTES,
    })
  }

  redirect(loginUrl ?? "/")
}
