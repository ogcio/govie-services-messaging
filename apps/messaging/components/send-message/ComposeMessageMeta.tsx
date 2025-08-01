"use client"
import {
  Details,
  FormField,
  Heading,
  Link,
  Paragraph,
  Radio,
  Select,
  SelectItem,
  Stack,
} from "@govie-ds/react"
import { useAnalytics } from "@ogcio/nextjs-analytics"
import { getCommonLogger } from "@ogcio/nextjs-logging-wrapper/common-logger"
import { MessageSecurityLevel } from "const/messaging"
import { useAsyncThrow } from "hooks/useAsyncThrow"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useCallback, useContext, useEffect, useMemo, useState } from "react"
import { defaultFormGap } from "utils/datetime"
import { getTemplate } from "@/app/[locale]/admin/send-a-message/getTemplate"
import { getTemplatesAndLanguage } from "@/app/[locale]/admin/send-a-message/getTemplatesAndLanguage"
import { SubmitButton } from "@/components/SubmitButton"
import { ANALYTICS } from "@/const/analytics"
import type { TemplateOptionApiPayload } from "@/types/types"
import { SendMessageContext } from "./SendMessageContext"

export default function ComposeMessageMeta() {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const analyticsClient = useAnalytics()
  const locale = useLocale()

  useEffect(() => {
    analyticsClient.trackEvent({
      event: {
        name: ANALYTICS.message.stepInitial.name,
        category: ANALYTICS.message.category,
        action: ANALYTICS.message.stepInitial.action,
      },
    })
  }, [analyticsClient.trackEvent])

  const logger = useCallback(() => {
    return getCommonLogger("error")
  }, [])
  const t = useTranslations("message.wizard.step.meta")

  const { message, onStep } = useContext(SendMessageContext)

  const [templateOptions, setTemplateOptions] = useState<
    TemplateOptionApiPayload[]
  >([])
  const [lang, setLang] = useState<string>()
  const [templates, setTemplates] = useState<
    Record<string, Awaited<ReturnType<typeof getTemplate>>>
  >({})
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [readyToRenderTemplate, setReadyToRenderTemplate] = useState(false)
  const asyncThrow = useAsyncThrow()

  useEffect(() => {
    const doFetch = async () => {
      try {
        const { templates, lang } = await getTemplatesAndLanguage()
        setTemplateOptions(templates)
        lang && setLang(lang)
      } catch (err) {
        asyncThrow(new Error(err))
      }
    }

    doFetch()
  }, [asyncThrow])

  useEffect(() => {
    if (templateOptions?.length) {
      const doFetch = async () => {
        try {
          const templateId =
            templateOptions.find((o) => o.id === searchParams.get("templateId"))
              ?.id || templateOptions.at(0)?.id
          if (!templateId) {
            throw new Error("no template id")
          }
          const template = await getTemplate(templateId)
          setSelectedTemplate(templateId)
          setTemplates((prev) => ({
            ...prev,
            [templateId]: template,
          }))
        } catch (error) {
          logger().error(error, "failed to get template")
          asyncThrow(new Error(error))
          return
        } finally {
          router.replace(pathname)
          setReadyToRenderTemplate(true)
        }
      }
      doFetch()
    }
  }, [
    templateOptions,
    asyncThrow,
    logger,
    pathname,
    router.replace,
    searchParams,
  ])

  const handleFormSubmit = useMemo(() => {
    return async (e: React.ChangeEvent<HTMLFormElement>) => {
      e.preventDefault()
      const formData = new FormData(e.currentTarget)
      const templateMetaId = formData.get("templateMetaId")?.toString() || ""
      const templateName =
        templateOptions
          .find((o) => o.id === templateMetaId)
          ?.contents?.find((c) => c.language === lang)?.templateName || ""

      message.securityLevel =
        (formData.get("securityLevel") as MessageSecurityLevel) ||
        MessageSecurityLevel.CONFIDENTIAL

      onStep(
        {
          ...message,
          templateName,
          templateMetaId,
        },
        "next",
      )
    }
  }, [message, onStep, templateOptions, lang])

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const doFetch = async () => {
      if (!templates[e.target.value]) {
        setReadyToRenderTemplate(false)
        try {
          const template = await getTemplate(e.target.value)
          setTemplates((prev) => ({ ...prev, [e.target.value]: template }))
        } catch (error) {
          logger().error(error, "failed to get template")
          asyncThrow(new Error(error))
          return
        } finally {
          setReadyToRenderTemplate(true)
        }
      }
    }
    doFetch()
    setSelectedTemplate(e.target.value)
  }

  const canSubmit = Boolean(
    templateOptions?.length && lang && readyToRenderTemplate,
  )

  return (
    <form onSubmit={handleFormSubmit}>
      <Stack direction='column' gap={defaultFormGap}>
        <Heading>{t("heading.main")}</Heading>

        <Paragraph>
          {t.rich("paragraph.main", {
            href: (chunks) => (
              <Link href={`/${locale}/admin/message-templates`}>{chunks}</Link>
            ),
          })}
        </Paragraph>

        <FormField
          label={{ text: t("heading.type"), htmlFor: "securityLevel" }}
        >
          <Stack direction='column' gap={2}>
            <Paragraph>{t("paragraph.type")}</Paragraph>
            <Stack direction='row' gap={2}>
              <Radio
                name='securityLevel'
                value={MessageSecurityLevel.CONFIDENTIAL}
                label={t("label.secure")}
                defaultChecked={true}
              />
              <Radio
                name='securityLevel'
                value={MessageSecurityLevel.PUBLIC}
                label={t("label.nonSecure")}
              />
            </Stack>
          </Stack>
        </FormField>
        <Details label={t("label.security")}>{t("details.security")}</Details>

        <FormField
          label={{ text: t("label.template"), htmlFor: "template-select" }}
        >
          <Select
            id='template-select'
            name='templateMetaId'
            onChange={handleTemplateSelect}
            value={selectedTemplate || undefined}
          >
            {selectedTemplate &&
              templateOptions?.map((template) => (
                <SelectItem key={template.id} value={template.id}>
                  {template.contents.find(
                    (content) => content.language === lang,
                  )?.templateName || template.contents.at(0)?.templateName}
                </SelectItem>
              ))}
          </Select>
        </FormField>

        {readyToRenderTemplate && (
          <Stack direction={"column"} gap={defaultFormGap}>
            <div>
              <Heading as='h2'>{t("heading.subject")}</Heading>
              <Paragraph>{templates[selectedTemplate]?.subject}</Paragraph>
            </div>

            <div>
              <Heading as='h2'>{t("heading.plainText")}</Heading>
              <Paragraph whitespace='break-spaces'>
                {templates[selectedTemplate]?.plainText}
              </Paragraph>
            </div>

            {templates[selectedTemplate]?.richText && (
              <div>
                <Heading as='h2'>{t("heading.richText")}</Heading>
                <Paragraph whitespace='break-spaces'>
                  {templates[selectedTemplate]?.richText}
                </Paragraph>
              </div>
            )}
          </Stack>
        )}

        <SubmitButton disabled={!canSubmit}>{t("button.submit")}</SubmitButton>
      </Stack>
    </form>
  )
}
