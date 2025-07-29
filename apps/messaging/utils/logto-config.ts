import { getDefaultScopes } from "@ogcio/nextjs-auth"
import { headers } from "next/headers"
import { routes } from "."
import { getCachedConfig } from "./env-config"

export const CustomHeaders = {
  Pathname: "x-pathname",
  Search: "x-search",
}

export const PostLoginSearchParams = {
  LoginUrl: "loginUrl",
  PostLoginRedirectPath: "postLoginRedirectPath",
}

export const postLoginRedirectUrlCookieName = "logtoPostLoginRedirectUrl"
export const socialConnectorIdCookieName = "connectorsToShow"

export const getLogtoContextParams = (organizationId?: string) => {
  const config = getCachedConfig()()
  return {
    additionalContextParams: {
      loginUrl: buildLoginUrlWithPostLoginRedirect(),
      organizationId,
      publicServantExpectedRoles: config.publicServantExpectedRoles,
    },
  }
}

export const getSignInConfiguration = () => {
  const {
    messagingApiResource,
    profileApiResource,
    uploadApiResource,
    baseUrl,
    appId,
    appSecret,
    citizenScopes,
    publicServantScopes,
    logtoCookieSecret,
    logtoEndpoint,
    isProductionEnv,
  } = getCachedConfig()()

  return {
    endpoint: logtoEndpoint,
    appId,
    appSecret,
    scopes: [...getDefaultScopes(), ...citizenScopes, ...publicServantScopes],
    resources: [messagingApiResource, profileApiResource, uploadApiResource],
    cookieSecret: logtoCookieSecret,
    cookieSecure: isProductionEnv,
    baseUrl: baseUrl,
  }
}

export const buildLoginUrlWithPostLoginRedirect = () => {
  const currentPath = headers().get(CustomHeaders.Pathname) ?? ""
  const currentSearch = headers().get(CustomHeaders.Search) ?? ""
  let redirectPath = currentPath
  if (currentSearch.trim().length > 0) {
    // we need to encode the search params to avoid them to be
    // interpreted as query params of the actual path
    redirectPath = `${redirectPath}${encodeURIComponent(currentSearch.trim())}`
  }

  const qp = new URLSearchParams({
    [PostLoginSearchParams.LoginUrl]: routes.logtoLogin.url,
    [PostLoginSearchParams.PostLoginRedirectPath]: redirectPath,
  })

  if (currentPath.includes("/admin")) {
    qp.append("admin", "true")
  }

  return `${routes.preLogin.url}?${qp.toString()}`
}

export const getLoginUrlWithCustomPostLoginRedirect = (
  baseUrl: string,
  postLoginRedirect: string,
) => {
  const qp = new URLSearchParams({
    [PostLoginSearchParams.LoginUrl]: routes.logtoLogin.url,
    [PostLoginSearchParams.PostLoginRedirectPath]: postLoginRedirect,
  })

  return `${baseUrl}${routes.preLogin.url}?${qp.toString()}`
}
