import { Heading, Stack } from "@govie-ds/react"
import { getTranslations } from "next-intl/server"
import { defaultFormGap } from "utils/datetime"
import TemplatesList from "@/components/message-templates/TemplatesList"

export default async (props: { params: { locale: string } }) => {
  const t = await getTranslations("template.heading")

  return (
    <Stack direction='column' gap={defaultFormGap}>
      <Heading>{t("main")}</Heading>
      <TemplatesList />
    </Stack>
  )
}
