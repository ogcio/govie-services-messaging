import { Heading, Paragraph, Stack } from "@govie-ds/react"
import { getTranslations } from "next-intl/server"
import { defaultFormGap } from "utils/datetime"

export default async () => {
  const t = await getTranslations("InactivePublicServant")

  return (
    <Stack direction='column' gap={defaultFormGap}>
      <Heading>{t("title")}</Heading>
      <Paragraph>{t("description")}</Paragraph>
    </Stack>
  )
}
