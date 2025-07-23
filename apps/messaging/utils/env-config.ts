import { getCommonLogger } from "@ogcio/nextjs-logging-wrapper/common-logger"
import { z } from "zod"
import { validateEnv } from "./env"
import { trimSlash, urlWithTrailingSlash } from "./url-with-trailing-slash"

export const PROFILE_PUBLIC_SERVANT_ROLE = "Profile Public Servant"

const requiredInProduction: z.RefinementEffect<
  string | undefined
>["refinement"] = (value, ctx) => {
  if (process.env.NODE_ENV === "production" && !value) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Missing required environment variable ${ctx.path.join(".")}`,
    })
  }
}

const requiredInDevelopment: z.RefinementEffect<
  string | undefined
>["refinement"] = (value, ctx) => {
  if (process.env.NODE_ENV === "development" && !value) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Missing required environment variable ${ctx.path.join(".")}`,
    })
  }
}

export const getCachedConfig = () => {
  let cachedConfig: ReturnType<typeof getConfig> | null = null

  return () => {
    if (cachedConfig) return cachedConfig

    try {
      cachedConfig = getConfig()
      return cachedConfig
    } catch (error) {
      const logger = getCommonLogger("error")
      logger.error("Error validating environment variables:", error)
      process.exit(1)
    }
  }
}

const getConfig = () => {
  const isBuild = process.env.NEXT_PHASE === "phase-production-build"

  if (isBuild) {
    return {
      messagingApiResource: "https://dummy.build.url",
      profileApiResource: "https://dummy.build.url",
      uploadApiResource: "https://dummy.build.url",
      formsServiceUrl: "https://dummy.build.url",
      reportFormId: "dummy",
      errorFormId: "dummy",
      feedbackFormId: "dummy",
      learnMoreFormId: "dummy",
      baseUrl: "https://dummy.build.url",
      baseUrlWithTrailingSlash: "https://dummy.build.url",
      profileAdminUrl: "https://dummy.build.url",
      profileUrl: "https://dummy.build.url",
      dashboardUrl: "https://dummy.build.url",
      dashboardAdminUrl: "https://dummy.build.url",
      appId: "dummy",
      appSecret: "dummy",
      logtoEndpoint: "https://dummy.build.url",
      logtoCookieSecret: "dummy",
      logLevel: "dummy",
      organizationId: "dummy",
      analytics: {
        client: {
          analyticsUrl: "dummy",
          analyticsWebsiteId: "dummy",
          analyticsAdminWebsiteId: "dummy",
          analyticsDryRun: true,
          analyticsOrganizationId: "dummy",
        },
        server: {
          analyticsUrl: "dummy",
          analyticsWebsiteId: "dummy",
          analyticsAdminWebsiteId: "dummy",
          analyticsDryRun: true,
          analyticsM2MAppId: "dummy",
          analyticsM2MAppSecret: "dummy",
          analyticsM2MOrganizationId: "dummy",
          analyticsM2MScopes: "dummy",
        },
      },
      onboardingM2MAppId: "dummy",
      onboardingM2MAppSecret: "dummy",
      citizenScopes: ["dummy"],
      publicServantScopes: ["dummy"],
      publicServantExpectedRoles: ["dummy"],
      isProductionEnv: false,
      useGovIdOnly: true,
      cookieDomain: "dummy",
      myGovIdEndSessionUrl: "dummy",
      // Observability
      o11y: {
        serverServiceName: "dummy",
        collectorUrl: "dummy",
        clientServiceName: "dummy",
        faroUrl: "dummy",
        faroCorsAllowedUrls: "dummy",
        logLevel: "info",
      },
    }
  }

  const env = validateEnv(
    z.object({
      MESSAGING_BACKEND_URL: z.string(),
      PROFILE_BACKEND_URL: z.string(),
      UPLOAD_BACKEND_URL: z.string(),
      GOVIE_FORMS_SERVICE_URL: z.string(),
      GOVIE_FORMS_REPORT_FORM_ID: z.string(),
      GOVIE_FORMS_ERROR_FORM_ID: z.string(),
      GOVIE_FORMS_FEEDBACK_FORM_ID: z.string(),
      GOVIE_FORMS_LEARN_MORE_FORM_ID: z.string(),
      NEXT_PUBLIC_MESSAGING_SERVICE_ENTRY_POINT: z.string(),
      NEXT_PUBLIC_PROFILE_ADMIN_SERVICE_ENTRY_POINT: z.string(),
      NEXT_PUBLIC_PROFILE_SERVICE_ENTRY_POINT: z.string(),
      NEXT_PUBLIC_DASHBOARD_SERVICE_ENTRY_POINT: z.string(),
      NEXT_PUBLIC_DASHBOARD_ADMIN_SERVICE_ENTRY_POINT: z.string(),
      LOGTO_MESSAGING_APP_ID: z.string(),
      LOGTO_MESSAGING_APP_SECRET: z.string(),
      LOGTO_ENDPOINT: z.string(),
      LOGTO_COOKIE_SECRET: z.string(),
      ANALYTICS_URL: z.string(),
      ANALYTICS_WEBSITE_ID: z.string(),
      ANALYTICS_ADMIN_WEBSITE_ID: z.string(),
      ANALYTICS_ORGANIZATION_ID: z.string(),
      LOGTO_M2M_ANALYTICS_APP_ID: z.string(),
      LOGTO_M2M_ANALYTICS_APP_SECRET: z.string(),
      LOGTO_M2M_ANALYTICS_ORGANIZATION_ID: z.string(),
      LOGTO_M2M_ANALYTICS_SCOPES: z.string(),
      LOGTO_M2M_ONBOARDING_APP_ID: z.string(),
      LOGTO_M2M_ONBOARDING_APP_SECRET: z.string(),
      LOG_LEVEL: z.string().optional(),
      NODE_ENV: z.string().optional(),
      ANALYTICS_DRY_RUN: z.string().optional(),
      DX_LOCAL_USE_GOVID_ONLY: z.string().optional(),
      COOKIE_DOMAIN: z.string().optional(),
      // Observability
      OTEL_SERVER_SERVICE_NAME: z
        .string()
        .optional()
        .superRefine(requiredInProduction),
      OTEL_COLLECTOR_URL: z
        .string()
        .optional()
        .superRefine(requiredInProduction),
      OTEL_CLIENT_SERVICE_NAME: z
        .string()
        .optional()
        .superRefine(requiredInProduction),
      OTEL_FARO_URL: z.string().optional().superRefine(requiredInProduction),
      OTEL_FARO_CORS_ALLOWED_URLS: z.string().optional(),
      OTEL_LOG_LEVEL: z.string().optional(),
      MYGOVID_END_SESSION_URL: z.string(),
    }),
  )

  const checkBoolean = (v: string) => v === "1" || v.toLowerCase() === "true"

  return {
    messagingApiResource: urlWithTrailingSlash(env.MESSAGING_BACKEND_URL),
    profileApiResource: urlWithTrailingSlash(env.PROFILE_BACKEND_URL),
    uploadApiResource: urlWithTrailingSlash(env.UPLOAD_BACKEND_URL),
    formsServiceUrl: trimSlash(env.GOVIE_FORMS_SERVICE_URL),
    reportFormId: env.GOVIE_FORMS_REPORT_FORM_ID,
    errorFormId: env.GOVIE_FORMS_ERROR_FORM_ID,
    feedbackFormId: env.GOVIE_FORMS_FEEDBACK_FORM_ID,
    learnMoreFormId: env.GOVIE_FORMS_LEARN_MORE_FORM_ID,
    baseUrl: trimSlash(env.NEXT_PUBLIC_MESSAGING_SERVICE_ENTRY_POINT),
    baseUrlWithTrailingSlash: urlWithTrailingSlash(
      trimSlash(env.NEXT_PUBLIC_MESSAGING_SERVICE_ENTRY_POINT),
    ),
    profileAdminUrl: trimSlash(
      env.NEXT_PUBLIC_PROFILE_ADMIN_SERVICE_ENTRY_POINT,
    ),
    profileUrl: trimSlash(env.NEXT_PUBLIC_PROFILE_SERVICE_ENTRY_POINT),
    dashboardUrl: trimSlash(env.NEXT_PUBLIC_DASHBOARD_SERVICE_ENTRY_POINT),
    dashboardAdminUrl: trimSlash(
      env.NEXT_PUBLIC_DASHBOARD_ADMIN_SERVICE_ENTRY_POINT,
    ),
    appId: env.LOGTO_MESSAGING_APP_ID,
    appSecret: env.LOGTO_MESSAGING_APP_SECRET,
    logtoEndpoint: env.LOGTO_ENDPOINT,
    logtoCookieSecret: env.LOGTO_COOKIE_SECRET,
    logLevel: env.LOG_LEVEL,
    analytics: {
      client: {
        analyticsUrl: trimSlash(env.ANALYTICS_URL),
        analyticsWebsiteId: env.ANALYTICS_WEBSITE_ID,
        analyticsAdminWebsiteId: env.ANALYTICS_ADMIN_WEBSITE_ID,
        analyticsDryRun: checkBoolean(env.ANALYTICS_DRY_RUN ?? "false"),
        analyticsOrganizationId: env.ANALYTICS_ORGANIZATION_ID,
      },
      server: {
        analyticsUrl: trimSlash(env.ANALYTICS_URL),
        analyticsWebsiteId: env.ANALYTICS_WEBSITE_ID,
        analyticsAdminWebsiteId: env.ANALYTICS_ADMIN_WEBSITE_ID,
        analyticsDryRun: checkBoolean(env.ANALYTICS_DRY_RUN ?? "false"),
        analyticsM2MAppId: env.LOGTO_M2M_ANALYTICS_APP_ID,
        analyticsM2MAppSecret: env.LOGTO_M2M_ANALYTICS_APP_SECRET,
        analyticsM2MOrganizationId: env.LOGTO_M2M_ANALYTICS_ORGANIZATION_ID,
        analyticsM2MScopes: env.LOGTO_M2M_ANALYTICS_SCOPES,
      },
    },
    onboardingM2MAppId: env.LOGTO_M2M_ONBOARDING_APP_ID,
    onboardingM2MAppSecret: env.LOGTO_M2M_ONBOARDING_APP_SECRET,
    citizenScopes: [
      "messaging:message.self:read",
      "messaging:message.self:write",
      "profile:user.self:write",
      "profile:user.self:read",
      "upload:file.self:read",
      "profile:user:onboarded",
    ],
    publicServantScopes: [
      "messaging:message:*",
      "messaging:provider:*",
      "messaging:template:*",
      "messaging:event:read",
      "profile:user:read",
      "profile:user:*",
    ],
    publicServantExpectedRoles: ["Messaging Public Servant"],
    isProductionEnv: env.NODE_ENV === "production",
    useGovIdOnly: checkBoolean(env.DX_LOCAL_USE_GOVID_ONLY ?? "false"),
    cookieDomain: env.COOKIE_DOMAIN,
    myGovIdEndSessionUrl: env.MYGOVID_END_SESSION_URL,
    // Observability
    o11y: {
      serverServiceName: env.OTEL_SERVER_SERVICE_NAME,
      collectorUrl: env.OTEL_COLLECTOR_URL,
      clientServiceName: env.OTEL_CLIENT_SERVICE_NAME,
      faroUrl: env.OTEL_FARO_URL,
      faroCorsAllowedUrls: env.OTEL_FARO_CORS_ALLOWED_URLS,
      logLevel: env.OTEL_LOG_LEVEL,
    },
  }
}
