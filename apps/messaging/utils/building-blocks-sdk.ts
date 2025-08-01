import { getBuildingBlockSDK, getM2MTokenFn } from "@ogcio/building-blocks-sdk"
import {
  AccessTokenError,
  type Analytics,
  type FeatureFlags,
  type GetAccessTokenParams,
  type GetOrganizationTokenParams,
  type Messaging,
  type Profile,
  type SERVICE_NAME,
  type Upload,
} from "@ogcio/building-blocks-sdk/dist/types"
import { headers } from "next/headers"
import { redirect } from "next/navigation"
import { getCachedConfig } from "./env-config"
import { urlWithTrailingSlash } from "./url-with-trailing-slash"

const getM2MBaseConfig = () => {
  const { logtoEndpoint } = getCachedConfig()()
  return {
    logtoOidcEndpoint: [urlWithTrailingSlash(logtoEndpoint), "oidc"].join(""),
  }
}

const getM2MOnboardingConfig = (
  scopes: string[],
  resource: string,
): GetAccessTokenParams => {
  const {
    onboardingM2MAppId: applicationId,
    onboardingM2MAppSecret: applicationSecret,
  } = getCachedConfig()()

  return {
    ...getM2MBaseConfig(),
    resource: urlWithTrailingSlash(resource),
    applicationId,
    applicationSecret,
    scopes,
  }
}

export const getAnalyticsM2MConfig = (): GetOrganizationTokenParams => {
  const serverConfig = getCachedConfig()().analytics.server

  return {
    ...getM2MBaseConfig(),
    organizationId: serverConfig.analyticsM2MOrganizationId,
    applicationId: serverConfig.analyticsM2MAppId,
    applicationSecret: serverConfig.analyticsM2MAppSecret,
    scopes: serverConfig.analyticsM2MScopes
      ? serverConfig.analyticsM2MScopes.split(",")
      : undefined,
  }
}

const invokeTokenApi = async (serviceName: string): Promise<string> => {
  let token = ""

  const {
    messagingApiResource,
    profileApiResource,
    featureFlags: { token: featureFlagsToken },
  } = getCachedConfig()()

  switch (serviceName) {
    case "featureFlags":
      token = featureFlagsToken
      break
    case "upload":
      token = await getAccessToken("/api/upload-token")
      break
    case "messaging":
      token = await getAccessToken("/api/token")
      break
    case "payments":
      token = await getAccessToken("/api/payments-token")
      break
    case "profile":
      token = await getAccessToken("/api/profile-token")
      break
    case "analytics":
      token = await getM2MTokenFn({
        services: {
          analytics: {
            getOrganizationTokenParams: getAnalyticsM2MConfig(),
          },
        },
      })(serviceName)
      break
    default: {
      const [service, _] = serviceName.split("-")
      token = await getM2MTokenFn({
        services: {
          messaging: {
            getAccessTokenParams: getM2MOnboardingConfig(
              ["messaging:message.onboarding:read"],
              messagingApiResource,
            ),
          },
          profile: {
            getAccessTokenParams: getM2MOnboardingConfig(
              ["profile:user.onboarding:read"],
              profileApiResource,
            ),
          },
        },
      })(service as SERVICE_NAME)
      break
    }
  }

  return token
}

const getAccessToken = async (path: string) => {
  const { baseUrl } = getCachedConfig()()
  const cookieHeader = headers().get("cookie") as string

  const res = await fetch(new URL(path, baseUrl), {
    headers: { cookie: cookieHeader },
  })
  const { token } = await res.json()
  return token
}

const getOnboardingSDK = () => {
  const { profileApiResource, messagingApiResource } = getCachedConfig()()
  return getBuildingBlockSDK({
    services: {
      profile: { baseUrl: profileApiResource },
      messaging: { baseUrl: messagingApiResource },
    },
    getTokenFn: async (serviceName: string) =>
      invokeTokenApi(`${serviceName}-onboarding`),
  })
}

const getSDKs = () => {
  const config = getCachedConfig()()

  return getBuildingBlockSDK({
    services: {
      messaging: { baseUrl: config.messagingApiResource },
      profile: { baseUrl: config.profileApiResource },
      upload: { baseUrl: config.uploadApiResource },
      featureFlags: { baseUrl: config.featureFlags.baseUrl },
      analytics: {
        baseUrl: config.analytics.server.analyticsUrl,
        dryRun: config.analytics.server.analyticsDryRun,
        trackingWebsiteId: config.analytics.server.analyticsWebsiteId,
        organizationId: config.analytics.server.analyticsM2MOrganizationId,
      },
    },
    getTokenFn: async (serviceName: string) => invokeTokenApi(serviceName),
  })
}

// biome-ignore lint/complexity/noStaticOnlyClass: legacy
export class BBClients {
  static errorHandler(target, prop) {
    const original = target[prop]
    if (typeof original === "function") {
      return async (...args) => {
        const result = await original.apply(target, args)
        if (result?.error && result.error instanceof AccessTokenError) {
          return redirect("/pre-login")
        }
        return result
      }
    }
    return original
  }

  static getMessagingClient() {
    return new Proxy<Messaging>(getSDKs().messaging, {
      get: BBClients.errorHandler,
    })
  }
  static getUploadClient() {
    return new Proxy<Upload>(getSDKs().upload, {
      get: BBClients.errorHandler,
    })
  }
  static getProfileClient() {
    return new Proxy<Profile>(getSDKs().profile, {
      get: BBClients.errorHandler,
    })
  }
  static getOnboardingClient() {
    return new Proxy<Messaging>(getOnboardingSDK().messaging, {
      get: BBClients.errorHandler,
    })
  }
  static getOnboardingProfileClient() {
    return new Proxy<Profile>(getOnboardingSDK().profile, {
      get: BBClients.errorHandler,
    })
  }
  static getAnalyticsClient() {
    return new Proxy<Analytics>(getSDKs().analytics, {
      get: BBClients.errorHandler,
    })
  }
  static getFeatureFlagsClient() {
    return new Proxy<FeatureFlags>(getSDKs().featureFlags, {
      get: BBClients.errorHandler,
    })
  }
}
