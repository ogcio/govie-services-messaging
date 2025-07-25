"use client"

import {
  Button,
  Container,
  Footer,
  Header,
  Link,
  Paragraph,
  Stack,
} from "@govie-ds/react"
import { useAnalytics } from "@ogcio/nextjs-analytics"
import { ANALYTICS } from "const/analytics"
import { useLocale, useTranslations } from "next-intl"
import { useEffect } from "react"
import { BodyContainer, MainContainer } from "@/components/containers"

export default function GlobalError(props: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations("errors.global")

  const analyticsClient = useAnalytics()
  const locale = useLocale()

  useEffect(() => {
    analyticsClient.trackEvent({
      event: {
        name: ANALYTICS.system.error.name,
        category: ANALYTICS.system.category,
        action: ANALYTICS.system.error.action,
      },
    })
  }, [analyticsClient.trackEvent])

  return (
    <html lang={locale}>
      <BodyContainer>
        <Header title={t("title")} />
        <MainContainer>
          <Container>
            <Stack direction='column' gap={6} style={{ paddingTop: "40px" }}>
              <Stack direction='column' gap={3}>
                <Paragraph>{t("paragraph.retry")}</Paragraph>
                <Button onClick={() => props.reset()}>{t("button")}</Button>
              </Stack>
              <Paragraph>
                {t.rich("paragraph.signout", {
                  link: (chunks) => (
                    <Link noVisited href='/signout'>
                      {chunks}
                    </Link>
                  ),
                })}
              </Paragraph>
              <Paragraph>{t("paragraph.support")}</Paragraph>
            </Stack>
          </Container>
        </MainContainer>
        <Footer />
      </BodyContainer>
    </html>
  )
}
