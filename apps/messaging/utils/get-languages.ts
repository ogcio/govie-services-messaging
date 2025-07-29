import { useTranslations } from "next-intl"
import { getTranslations } from "next-intl/server"
import { LANG_EN, LANG_GA } from "@/types/shared"
import { buildClientUrlWithSearchParams } from "./url-utils.client"
import { buildServerUrlWithSearchParams } from "./url-utils.server"

const getServerLanguages = async ({
  path,
  locale,
  search,
}: {
  path: string | null
  locale: string
  search: string | null
}) => {
  const t = await getTranslations("navigation.header")
  const isEnglish = locale === LANG_EN
  const oppositeLanguage = isEnglish ? LANG_GA : LANG_EN

  const languageToggleUrl = buildServerUrlWithSearchParams({
    dir: path
      ? `${path.replace(/(\/en\/|\/ga\/)/, `/${oppositeLanguage}/`)}`
      : "",
    searchParams: {
      search: search || "",
    },
  })

  const oppositeLanguageLabel = isEnglish ? t("link.irish") : t("link.english")

  return { href: languageToggleUrl.href, label: oppositeLanguageLabel }
}

const getClientLanguages = ({
  path,
  locale,
  search,
}: {
  path: string | null
  locale: string
  search: string | null
}) => {
  const t = useTranslations("navigation.header")
  const isEnglish = locale === LANG_EN
  const oppositeLanguage = isEnglish ? LANG_GA : LANG_EN

  const languageToggleUrl = buildClientUrlWithSearchParams({
    dir: path
      ? `${path.replace(/(\/en\/|\/ga\/)/, `/${oppositeLanguage}/`)}`
      : "",
    searchParams: {
      search: search || "",
    },
  })

  const oppositeLanguageLabel = isEnglish ? t("link.irish") : t("link.english")

  return { href: languageToggleUrl.href, label: oppositeLanguageLabel }
}

export { getServerLanguages, getClientLanguages }
