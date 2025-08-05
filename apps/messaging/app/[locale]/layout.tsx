import "./styles.css"
import { Container, Stack, ToastProvider } from "@govie-ds/react"
import { AnalyticsProvider } from "@ogcio/nextjs-analytics"
import { FaroWrapper } from "hooks/use-faro"
import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ApplicationFooter } from "@/components/ApplicationFooter"
import { ConsentBanner } from "@/components/consent/ConsentBanner"
import { MessagingConsentWrapper } from "@/components/consent/MessagingConsentWrapper"
import {
  getAndMaybeSetConsentStatus,
  getConsentStatementContent,
} from "@/components/consent/messaging-consent-api"
import {
  BodyContainer,
  FullWidthContainer,
  MainContainer,
} from "@/components/containers"
import { FeatureFlagsProvider } from "@/components/FeatureFlagsProvider"
import { PageHeader } from "@/components/navigation/PageHeader"
import { UserProvider } from "@/components/UserContext"
import favicon from "@/public/favicon.ico"
import { getCachedConfig } from "@/utils/env-config"
import { requireProfile, requireUser } from "./loaders"

export const metadata: Metadata = {
  title: "Messaging",
  icons: [{ rel: "icon", url: favicon.src }],
}

export default async ({
  children,
  params,
}: {
  children: React.ReactNode
  params: { locale: string }
}) => {
  const user = await requireUser()
  const { profile } = await requireProfile({
    userId: user.id,
  })
  const consentStatementContent = await getConsentStatementContent({
    locale: params.locale,
  })
  const { consentStatus, isConsentEnabled, userConsentStatementId } =
    await getAndMaybeSetConsentStatus({
      profile,
      latestConsentStatementId: consentStatementContent.version.id,
    })

  const t = await getTranslations("home")
  const config = getCachedConfig()()

  const analyticsConfig = {
    baseUrl: config.analytics.client.analyticsUrl,
    // HACK: until the messaging app is split into two separate apps, one for public servants and one for citizens,
    // we need to use the correct tracking website id based on the user type
    // this assumes that the user is either a public servant or a citizen and that admin pages are not used by citizens
    trackingWebsiteId: user.isPublicServant
      ? config.analytics.client.analyticsAdminWebsiteId
      : config.analytics.client.analyticsWebsiteId,
    organizationId: config.analytics.client.analyticsOrganizationId,
    dryRun: config.analytics.client.analyticsDryRun,
  }

  return (
    <html lang={params.locale}>
      <BodyContainer>
        <FaroWrapper config={config.o11y}>
          <AnalyticsProvider config={analyticsConfig}>
            <UserProvider user={user}>
              <FeatureFlagsProvider isConsentEnabled={isConsentEnabled}>
                <MessagingConsentWrapper
                  userContext={{
                    isPublicServant: user.isPublicServant,
                    preferredLanguage: profile.preferredLanguage,
                  }}
                  consentStatus={consentStatus}
                  isConsentEnabled={isConsentEnabled}
                  consentStatementContent={consentStatementContent}
                  userConsentStatementId={userConsentStatementId}
                >
                  <ToastProvider />
                  <PageHeader
                    config={{
                      profileAdminUrl: config.profileAdminUrl,
                      profileUrl: config.profileUrl,
                      dashboardUrl: config.dashboardUrl,
                      dashboardAdminUrl: config.dashboardAdminUrl,
                      messagingUrl: config.baseUrl,
                    }}
                    publicName={profile.publicName || ""}
                  />
                  <MainContainer>
                    <Container>
                      <Stack
                        direction='row'
                        wrap
                        gap={10}
                        aria-label={t("arialabel.mainContent")}
                      >
                        <FullWidthContainer>
                          <ConsentBanner profileUrl={config.profileUrl} />
                          {children}
                        </FullWidthContainer>
                      </Stack>
                    </Container>
                  </MainContainer>
                  <ApplicationFooter profileUrl={config.profileUrl} />
                </MessagingConsentWrapper>
              </FeatureFlagsProvider>
            </UserProvider>
          </AnalyticsProvider>
        </FaroWrapper>
      </BodyContainer>
    </html>
  )
}
