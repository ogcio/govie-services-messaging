"use client"
import {
  BreadcrumbCurrentLink,
  BreadcrumbLink,
  Breadcrumbs,
  Checkbox,
  Heading,
  Stack,
} from "@govie-ds/react"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { defaultFormGap } from "utils/datetime"
import { BackLink } from "@/components/BackButton"
import { LANG_EN, LANG_GA } from "@/types/shared"
import type { MessageTemplateFormData } from "@/types/types"
import { ContentForm } from "./ContentForm"

export const MessageTemplateForm = ({
  templates,
}: {
  templates?: MessageTemplateFormData
}) => {
  const t = useTranslations("MessageTemplate")
  const locale = useLocale()
  const [languages, setlanguages] = useState<string[]>([])

  // biome-ignore lint/correctness/useExhaustiveDependencies: needed
  useEffect(() => {
    if (templates?.languages.length) {
      setlanguages(templates.languages)
    }
  }, [])

  const onChangeLanguage = (lang: string) => {
    if (languages.includes(lang)) {
      setlanguages(languages.filter((l) => l !== lang))
    } else {
      setlanguages((prev) => {
        if (lang === LANG_EN) {
          return [lang, ...prev]
        }
        return [...prev, lang]
      })
    }
  }

  return (
    <Stack direction='column' gap={defaultFormGap}>
      <Breadcrumbs>
        <BreadcrumbLink href={`/${locale}/admin/message-templates`}>
          {t("templates")}
        </BreadcrumbLink>
        <BreadcrumbCurrentLink href=''>
          {templates?.templateId ? t("update") : t("create")}
        </BreadcrumbCurrentLink>
      </Breadcrumbs>

      <Heading>
        {templates?.templateId
          ? t("updateTemplateHeader")
          : t("createNewTemplateHeader")}
      </Heading>

      <Heading as='h2' size='sm'>
        {t("selectLanguagesHeading")}
      </Heading>
      {[LANG_EN, LANG_GA].map((lang: typeof LANG_EN | typeof LANG_GA) => (
        <Checkbox
          // biome-ignore lint/suspicious/noExplicitAny: Because DS
          size={"sm" as any}
          key={lang}
          id={lang}
          name={lang}
          onChange={() => onChangeLanguage(lang)}
          checked={languages.some((language) => language === lang)}
          value={`${lang} selector`}
          label={t(lang)}
        />
      ))}

      {languages.length ? (
        <ContentForm
          languages={languages}
          templates={templates}
          templateId={templates?.templateId}
        />
      ) : null}

      <BackLink href={`/${locale}/admin/message-templates`}>
        {t("backLink")}
      </BackLink>
    </Stack>
  )
}
