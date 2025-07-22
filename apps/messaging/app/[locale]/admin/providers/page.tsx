import { Heading, Link, Stack } from "@govie-ds/react"
import { getTranslations } from "next-intl/server"
import { defaultFormGap } from "utils/datetime"
import { providerRoutes } from "utils/routes"
import { buildServerUrl } from "utils/url-utils.server"
import EmailProviders from "@/components/providers/EmailProviders"

export default async (props: {
  params: { locale: string }
  searchParams?: { provider?: string; deleteId?: string }
}) => {
  const t = await getTranslations("settings.Page")
  const provider = props.searchParams?.provider
  const isEmail = provider === "email" || !provider

  return (
    <Stack direction='column' gap={defaultFormGap}>
      <Heading> {t("header")} </Heading>
      <Link
        href={
          buildServerUrl({
            locale: props.params.locale,
            url: `${providerRoutes.url}/email`,
          }).href
        }
        noUnderline
        asButton={{}}
      >
        {t("addProvider")}
      </Link>
      {isEmail && <EmailProviders />}
    </Stack>
  )
}
