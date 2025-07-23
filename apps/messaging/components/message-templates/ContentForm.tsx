"use client"
import {
  FormField,
  Heading,
  List,
  Paragraph,
  Stack,
  TextArea,
  TextInput,
} from "@govie-ds/react"
import { useTranslations } from "next-intl"
import { useFormState } from "react-dom"
import { defaultFormGap } from "utils/datetime"
import createOrUpdateTemplateAction from "@/app/[locale]/admin/message-templates/template/action"
import { SubmitButton } from "@/components/SubmitButton"
import { LANG_EN, LANG_GA } from "@/types/shared"
import type { MessageTemplateFormData } from "../../types/types"

export const VALID_TEMPLATE_VARIABLES = ["publicName", "ppsn", "email"]

const ContentForm = (props: {
  languages?: string[]
  templates?: MessageTemplateFormData
  templateId?: string
}) => {
  const t = useTranslations("MessageTemplate")
  const headerMap = { [LANG_EN]: "English", [LANG_GA]: "Gaeilge" }
  const [state, formAction] = useFormState(
    createOrUpdateTemplateAction,
    undefined,
  )

  return (
    <form action={formAction}>
      <Stack direction='column' gap={defaultFormGap}>
        <input type='hidden' name='templateId' value={props.templateId} />
        <input
          type='hidden'
          name='languages'
          value={props.languages?.join(",")}
        />
        <Paragraph>{t("interpolateHint")}</Paragraph>
        <Heading as='h2' size='sm'>
          {t("allowedVariablesHeading")}
        </Heading>

        <List
          items={VALID_TEMPLATE_VARIABLES.map((varName) => `{{${varName}}}`)}
        />

        {props.languages?.map((language) => (
          <Stack key={language} direction='column' gap={defaultFormGap}>
            <Heading as='h3'>{headerMap[language]}</Heading>

            <FormField
              error={state?.errors?.[language]?.templateName?.join(", ")}
              label={{
                text: t("templateNameLabel"),
                htmlFor: `${language}_templateName`,
              }}
            >
              <TextInput
                id={`${language}_templateName`}
                name={`${language}_templateName`}
                autoComplete='off'
                defaultValue={props.templates?.[language]?.templateName}
              />
            </FormField>

            <FormField
              error={state?.errors?.[language]?.subject?.join(", ")}
              label={{
                text: t("subjectLabel"),
                htmlFor: `${language}_subject`,
              }}
            >
              <TextArea
                id={`${language}_subject`}
                name={`${language}_subject`}
                autoComplete='off'
                defaultValue={props.templates?.[language]?.subject}
              />
            </FormField>

            <FormField
              error={state?.errors?.[language]?.richText?.join(", ")}
              label={{
                text: t("richTextLabel"),
                htmlFor: `${language}_richText`,
              }}
            >
              <TextArea
                id={`${language}_richText`}
                name={`${language}_richText`}
                autoComplete='off'
                defaultValue={props.templates?.[language]?.richText}
                rows={15}
              />
            </FormField>

            <FormField
              error={state?.errors?.[language]?.plainText?.join(", ")}
              label={{
                text: t("plainTextLabel"),
                htmlFor: `${language}_plainText`,
              }}
            >
              <TextArea
                id={`${language}_plainText`}
                name={`${language}_plainText`}
                autoComplete='off'
                defaultValue={props.templates?.[language]?.plainText}
                rows={15}
              />
            </FormField>
          </Stack>
        ))}
        <SubmitButton disabled={!props.languages?.length}>
          {props.templateId ? t("update") : t("create")}
        </SubmitButton>
      </Stack>
    </form>
  )
}

export { ContentForm }
