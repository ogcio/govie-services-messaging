"use client"

// biome-ignore assist/source/organizeImports: TODO
import {
  Alert,
  Link,
  List,
  ModalWrapper,
  Spinner,
  Stack,
  toaster,
} from "@govie-ds/react"
import {
  Button,
  ModalBody,
  ModalFooter,
  ModalTitle,
  Paragraph,
} from "@govie-ds/react"
import { useTranslations } from "next-intl"
import { useConsent } from "./ConsentProvider"
import { useState, type ReactElement } from "react"
import { handleConsent } from "@/app/[locale]/consent/actions"
import { useRouter } from "next/navigation"
import { CONSENT_ACTIONS, ConsentAnalyticsEvent } from "./analytics"
import { useAnalytics } from "@ogcio/nextjs-analytics"

export const ConsentModal = () => {
  const t = useTranslations()
  const {
    isConsentModalOpen,
    setIsConsentModalOpen,
    profileId,
    preferredLanguage,
  } = useConsent()
  const [isLoading, setIsLoading] = useState({
    accept: false,
    decline: false,
  })
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const analytics = useAnalytics()

  // TODO: handle these properly
  const footerLinks = {
    tc: "https://www.gov.ie/en/privacy-and-data-protection/privacy-notices/privacy-notice-for-messagingie/",
    privacy:
      "https://www.gov.ie/en/privacy-and-data-protection/privacy-notices/privacy-notice-for-messagingie/",
  }

  const doHandleConsent = async (accept: boolean) => {
    setIsLoading({
      accept,
      decline: !accept,
    })
    const action = accept ? CONSENT_ACTIONS.ACCEPT : CONSENT_ACTIONS.DECLINE
    analytics.trackEvent(
      ConsentAnalyticsEvent({
        name: "consent",
        action,
      }),
    )
    const result = await handleConsent({
      accept,
      profileId,
      preferredLanguage,
    })
    setIsLoading({
      accept: false,
      decline: false,
    })
    if (result.error) {
      // Note: a toaster won't be visible behind the modal overlay
      setError(result.error)
      analytics.trackEvent(
        ConsentAnalyticsEvent({
          name: "consent-error",
          action,
        }),
      )
      return
    }
    analytics.trackEvent(
      ConsentAnalyticsEvent({
        name: "consent-success",
        action,
      }),
    )
    setIsConsentModalOpen(false)
    router.refresh()
    toaster.create({
      position: {
        x: "right",
        y: "top",
      },
      title: t("consent.success.title"),
      dismissible: true,
      variant: "success",
    })
  }

  return (
    <ModalWrapper
      size='md'
      isOpen={isConsentModalOpen}
      closeOnClick={false}
      closeOnOverlayClick={false}
      onClose={() => setIsConsentModalOpen(false)}
    >
      <ModalTitle>{t("consent.title")}</ModalTitle>
      <ModalBody>
        {/* Note: if we put this in the stack it will loose full-width */}
        {error && (
          <div className='gi-mb-4'>
            <Alert variant='danger' title={t("consent.error.title")}>
              <Paragraph>{t("consent.error.body")}</Paragraph>
            </Alert>
          </div>
        )}
        <Stack direction='column' gap={4}>
          <Paragraph>
            {t.rich("consent.body.top.0", {
              b: (chunks) => <b>{chunks}</b>,
            })}
          </Paragraph>
          <Paragraph>
            {t.rich("consent.body.top.1", {
              b: (chunks) => <b>{chunks}</b>,
            })}
          </Paragraph>
          <List
            type='bullet'
            items={[t("consent.body.list.0"), t("consent.body.list.1")]}
          />
          <Paragraph>
            {t.rich("consent.body.bottom", {
              b: (chunks) => <b>{chunks}</b>,
              br: () => <br />,
            })}
          </Paragraph>
          <Alert variant='info' title={t("consent.body.small.title")}>
            <List
              className='gi-text-sm'
              items={[
                t.rich("consent.body.small.0", {
                  b: (chunks) => <b>{chunks}</b>,
                }) as ReactElement,
                t.rich("consent.body.small.1", {
                  b: (chunks) => <b>{chunks}</b>,
                }) as ReactElement,
              ]}
            />
          </Alert>
          <Paragraph style={{ maxWidth: "unset" }} size='sm'>
            {t.rich("consent.body.footer", {
              link1: (chunks) => <Link href={footerLinks.tc}>{chunks}</Link>,
              link2: (chunks) => (
                <Link href={footerLinks.privacy}>{chunks}</Link>
              ),
            })}
          </Paragraph>
        </Stack>
      </ModalBody>
      <ModalFooter>
        <Button
          variant='secondary'
          disabled={isLoading.decline || isLoading.accept}
          onClick={() => doHandleConsent(false)}
        >
          {t("consent.button.decline")}
          {isLoading.decline && <Spinner />}
        </Button>
        <Button
          variant='primary'
          disabled={isLoading.accept || isLoading.decline}
          onClick={() => doHandleConsent(true)}
        >
          {t("consent.button.accept")}
          {isLoading.accept && <Spinner />}
        </Button>
      </ModalFooter>
    </ModalWrapper>
  )
}
