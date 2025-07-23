import { Heading, Paragraph, Stack } from "@govie-ds/react"
import { getTranslations } from "next-intl/server"
import { ConfirmButton } from "@/components/account-linking/ConfirmButton"
import { DEFAULT_STACK_GAP } from "@/components/account-linking/const"
import { ProfileMatchInfo } from "@/components/account-linking/ProfileMatchInfo"
import { ReportButton } from "@/components/account-linking/ReportButton"
import { ServiceError } from "@/components/account-linking/ServiceError"
import { defaultFormGap } from "@/utils/datetime"
import loader from "./loader"

export default async (props: {
  params: { locale?: string; messageId: string }
}) => {
  const t = await getTranslations("accountLinking")
  const { linkedProfile, currentProfile, error } = await loader(props)

  if (error) {
    return <ServiceError />
  }

  return (
    <Stack direction='column' gap={defaultFormGap}>
      <Heading level={1}>{t("title")}</Heading>
      <Paragraph>{t("description")}</Paragraph>
      <ProfileMatchInfo
        currentEmail={currentProfile?.data.email}
        matchedEmail={linkedProfile?.data.email}
      />
      <Paragraph>
        {t.rich("footer", {
          bold: (chunks) => <b>{chunks}</b>,
          br: () => <br />,
        })}
      </Paragraph>
      <Stack direction='row' gap={DEFAULT_STACK_GAP} itemsAlignment={"end"}>
        <ReportButton />
        <ConfirmButton
          currentUserId={currentProfile?.data.id}
          targetUserId={linkedProfile?.data.id}
          messageId={props.params.messageId}
        />
      </Stack>
    </Stack>
  )
}
