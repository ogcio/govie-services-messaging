import { Button, Heading, Link, List, Paragraph, Stack } from "@govie-ds/react"
import Image from "next/image"
import { getTranslations } from "next-intl/server"
import { defaultFormGap } from "utils/datetime"
import { getLinks } from "utils/messaging"
import { TwoColumnLayout } from "@/components/containers"
import hero from "@/public/landingPage/hero.png"
import multiChannel from "@/public/landingPage/multi_channel.png"
import postbox from "@/public/landingPage/postbox.png"
import template from "@/public/landingPage/template.png"

export default async ({
  params,
}: {
  params: {
    locale: string
  }
}) => {
  const t = await getTranslations("LandingPage")
  const links = getLinks(params.locale)

  return (
    <Stack direction='column' gap={defaultFormGap} hasDivider>
      <TwoColumnLayout>
        <Stack direction='column' gap={defaultFormGap}>
          <Heading>{t("sections.main.title")}</Heading>
          <Stack direction='column' gap={2}>
            <Paragraph>{t("sections.main.listDescription")}</Paragraph>
            <List
              type='bullet'
              items={[
                t("sections.main.listItem1"),
                t("sections.main.listItem2"),
                t("sections.main.listItem3"),
              ]}
            />
            <Paragraph>{t("sections.main.description")}</Paragraph>
          </Stack>
        </Stack>
        <div>
          <Image
            src={hero}
            alt={t("sections.main.title")}
            layout='responsive'
          />
        </div>
      </TwoColumnLayout>

      <Stack direction='column' gap={defaultFormGap}>
        <Heading as='h2'>{t("sections.benefits.title")}</Heading>
        <TwoColumnLayout>
          <Stack direction='column' gap={defaultFormGap}>
            <Heading as='h3'>{t("sections.benefits.section1.title")}</Heading>
            <Paragraph>{t("sections.benefits.section1.description")}</Paragraph>
          </Stack>
          <div>
            <Image
              src={multiChannel}
              alt={t("sections.benefits.section1.title")}
              layout='responsive'
            />
          </div>
        </TwoColumnLayout>
      </Stack>

      <Stack direction='column' gap={defaultFormGap}>
        <Heading as='h3'>{t("sections.benefits.section2.title")}</Heading>
        <Paragraph>{t("sections.benefits.section2.description")}</Paragraph>

        <TwoColumnLayout>
          <Stack direction='column' gap={defaultFormGap}>
            <Heading as='h3'>{t("sections.benefits.section3.title")}</Heading>
            <Paragraph>{t("sections.benefits.section3.description")}</Paragraph>
          </Stack>
          <div>
            <Image
              src={template}
              alt={t("sections.benefits.section2.title")}
              layout='responsive'
            />
          </div>
        </TwoColumnLayout>
      </Stack>

      <TwoColumnLayout>
        <Stack direction='column' gap={defaultFormGap}>
          <Heading as='h3'>{t("sections.benefits.section4.title")}</Heading>
          <Paragraph>{t("sections.benefits.section4.description")}</Paragraph>
        </Stack>
        <div>
          <Image
            src={postbox}
            alt={t("sections.benefits.section3.title")}
            layout='responsive'
          />
        </div>
      </TwoColumnLayout>

      <Stack direction='column' gap={defaultFormGap} hasDivider>
        <Stack direction='row' gap={defaultFormGap} itemsDistribution='between'>
          <Heading as='h3'>{t("sections.benefits.section5.title")}</Heading>
          <Paragraph>{t("sections.benefits.section5.description")}</Paragraph>
        </Stack>

        <Stack direction='row' gap={defaultFormGap} itemsDistribution='between'>
          <Heading as='h3'>{t("sections.benefits.section6.title")}</Heading>
          <Paragraph>{t("sections.benefits.section6.description")}</Paragraph>
        </Stack>

        <Stack direction='row' gap={defaultFormGap} itemsDistribution='between'>
          <Heading as='h3'>{t("sections.getStarted.title")}</Heading>
          <div>
            <Stack direction='column' gap={2}>
              <Paragraph>{t("sections.getStarted.description")}</Paragraph>
              <Link href={links.learnMoreForm.href}>
                <Button type='button'>
                  {t("sections.getStarted.cta")}
                  <svg
                    width='16'
                    height='17'
                    viewBox='0 0 16 17'
                    fill='none'
                    xmlns='http://www.w3.org/2000/svg'
                  >
                    <title>Icon right</title>
                    <path
                      d='M8 0.5L6.59 1.91L12.17 7.5H0V9.5H12.17L6.59 15.09L8 16.5L16 8.5L8 0.5Z'
                      fill='white'
                    />
                  </svg>
                </Button>
              </Link>
            </Stack>
          </div>
        </Stack>
      </Stack>
    </Stack>
  )
}
