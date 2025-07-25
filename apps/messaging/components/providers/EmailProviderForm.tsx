"use client"
import {
  BreadcrumbCurrentLink,
  BreadcrumbLink,
  Breadcrumbs,
  Checkbox,
  FormField,
  Heading,
  Stack,
  TextInput,
  toaster,
} from "@govie-ds/react"
import { useRouter } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useEffect } from "react"
import { useFormState } from "react-dom"
import { defaultFormGap } from "utils/datetime"
import createOrUpdateEmailProviderAction from "@/app/[locale]/admin/providers/email/action"
import { BackLink } from "@/components/BackButton"
import { SubmitButton } from "@/components/SubmitButton"
import type { EmailProviderApiPayload } from "@/types/types"

const EmailProviderForm = ({
  provider,
}: {
  provider?: EmailProviderApiPayload
}) => {
  const locale = useLocale()
  const router = useRouter()
  const t = useTranslations("settings.EmailProvider")
  const tCommons = useTranslations("Commons")

  const [state, formAction] = useFormState(
    createOrUpdateEmailProviderAction,
    undefined,
  )

  useEffect(() => {
    if (state?.id) {
      router.push("./")
    }
  }, [state?.id, router])

  useEffect(() => {
    if (state?.errors?.server) {
      toaster.create({
        title: state.errors.server,
        position: {
          x: "right",
          y: "top",
        },
        variant: "danger",
      })
    }
  }, [state?.errors?.server])

  return (
    <Stack direction='column' gap={defaultFormGap}>
      <Breadcrumbs>
        <BreadcrumbLink href={`/${locale}/admin/providers`}>
          {t("providers")}
        </BreadcrumbLink>
        {/* Whenever this seem to actually do something, update href */}
        <BreadcrumbCurrentLink href='/'>
          {provider?.id ? t("updateButton") : t("createButton")}
        </BreadcrumbCurrentLink>
      </Breadcrumbs>
      <Heading>{provider?.id ? t("titleUpdate") : t("titleAdd")}</Heading>

      <form
        action={formAction}
        autoComplete='off'
        className='twelve-column-layout'
        style={{ width: "100%" }}
      >
        <input name='id' value={provider?.id} type='hidden' />
        <FormField
          className='two-thirds-col-span'
          label={{ text: t("nameLabel"), htmlFor: "providerName" }}
          error={
            state?.errors?.providerName
              ? { text: state?.errors?.providerName.join(", ") }
              : undefined
          }
        >
          <TextInput
            id='providerName'
            name='providerName'
            autoComplete='off'
            defaultValue={provider?.providerName}
          />
        </FormField>

        <FormField
          className='two-thirds-col-span'
          label={{ text: t("fromAddressLabel"), htmlFor: "fromAddress" }}
          error={
            state?.errors?.fromAddress
              ? { text: state?.errors?.fromAddress.join(", ") }
              : undefined
          }
        >
          <TextInput
            id='fromAddress'
            name='fromAddress'
            autoComplete='off'
            defaultValue={provider?.fromAddress}
          />
        </FormField>

        <FormField
          className='two-thirds-col-span'
          label={{ text: t("hostLabel"), htmlFor: "smtpHost" }}
          error={
            state?.errors?.smtpHost
              ? { text: state?.errors?.smtpHost.join(", ") }
              : undefined
          }
        >
          <TextInput
            id='smtpHost'
            name='smtpHost'
            autoComplete='off'
            defaultValue={provider?.smtpHost}
          />
        </FormField>

        <FormField
          className='two-thirds-col-span'
          label={{ text: t("portLabel"), htmlFor: "smtpPort" }}
          error={
            state?.errors?.smtpPort
              ? { text: state?.errors?.smtpPort.join(", ") }
              : undefined
          }
        >
          <TextInput
            id='smtpPort'
            name='smtpPort'
            autoComplete='off'
            defaultValue={provider?.smtpPort}
          />
        </FormField>

        <FormField className='two-thirds-col-span'>
          <Checkbox
            id='ssl'
            name='ssl'
            value='ssl'
            // defaultChecked={provider?.ssl}
            defaultChecked={true}
            label={t("ssl")}
          />
        </FormField>

        <FormField className='two-thirds-col-span'>
          <Checkbox
            id='isPrimary'
            name='isPrimary'
            value='isPrimary'
            defaultChecked={provider?.isPrimary}
            label={t("isPrimary")}
          />
        </FormField>

        <FormField
          className='two-thirds-col-span'
          label={{ text: t("usernameLabel"), htmlFor: "username" }}
          error={
            state?.errors?.username
              ? { text: state?.errors?.username.join(", ") }
              : undefined
          }
        >
          <TextInput
            id='username'
            name='username'
            autoComplete='off'
            defaultValue={provider?.username}
          />
        </FormField>

        <FormField
          className='two-thirds-col-span'
          label={{ text: t("passwordLabel"), htmlFor: "password" }}
          error={
            state?.errors?.password
              ? { text: state?.errors?.password.join(", ") }
              : undefined
          }
        >
          <TextInput
            id='password'
            type='password'
            name='password'
            autoComplete='off'
            defaultValue={provider?.password}
          />
        </FormField>

        <SubmitButton className='new-grid-row'>
          {provider ? t("updateButton") : t("createButton")}
        </SubmitButton>
      </form>
      <BackLink href={`/${locale}/admin/providers`}>
        {tCommons("backLink")}
      </BackLink>
    </Stack>
  )
}

export { EmailProviderForm }
