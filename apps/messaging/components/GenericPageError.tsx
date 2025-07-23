"use client"

import { Button, Paragraph, Stack } from "@govie-ds/react"
import { useTranslations } from "next-intl"

export default function ({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const t = useTranslations("errors.page")
  return (
    <Stack direction='column' gap={6}>
      <Paragraph>{t("paragraph")}</Paragraph>
      <Button onClick={() => reset()}>{t("button")}</Button>
    </Stack>
  )
}
