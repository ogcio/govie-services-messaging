"use client"

import { Button, InputText, Stack } from "@govie-ds/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import { FullWidthContainer } from "@/components/containers"

export default function SearchBar() {
  const t = useTranslations("search")
  const searchParams = useSearchParams()
  const router = useRouter()
  const [searchValue, setSeachValue] = useState("")

  useEffect(() => {
    setSeachValue(searchParams.get("search")?.toString() || "")
  }, [searchParams])

  const handleSearchClick = () => {
    const params = new URLSearchParams(searchParams)
    params.delete("page")
    params.set("search", searchValue)
    router.push(`?${params.toString()}`)
  }

  const handleResetClick = () => {
    router.push("?")
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSeachValue(e.target.value)

  const handleInputKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearchClick()
    }
  }

  return (
    <FullWidthContainer>
      <Stack
        direction='row'
        gap={3}
        itemsAlignment='end'
        fixedHeight='fit-content'
        aria-label={t("ariaLabel.search")}
      >
        <InputText
          placeholder={t("input.placeholder")}
          value={searchValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyPress}
          aria-label={t("label.search")}
        />
        <Button onClick={handleSearchClick}>{t("button.search")}</Button>
        <Button variant='secondary' onClick={handleResetClick}>
          {t("button.reset")}
        </Button>
      </Stack>
    </FullWidthContainer>
  )
}
