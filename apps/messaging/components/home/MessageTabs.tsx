"use client"

import { TabItem, TabList, TabPanel, Tabs } from "@govie-ds/react"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import "./hideTabPanel.css"
import { useState } from "react"
import { parseTab } from "./MessageTable"

export function MessageTabs() {
  const t = useTranslations("home")
  const searchParams = useSearchParams()
  const router = useRouter()
  const tab = parseTab(searchParams.get("tab")?.toString())

  const [checked, setChecked] = useState<
    ReturnType<typeof parseTab> | undefined
  >(tab)

  const unreadClick = () => {
    router.push("?tab=unread")
    setChecked("unread")
  }

  const allClick = () => {
    router.push("?tab=all")
    setChecked("all")
  }

  return (
    <Tabs ariaLabelledBy='bror' id='tabs'>
      <TabList tabName='tab-list'>
        <TabItem
          value='unread'
          checked={checked === "unread"}
          ariaLabel={t("arialabel.unread")}
          onTabClick={unreadClick}
        >
          {t("tab.unread")}
        </TabItem>
        <TabItem
          ariaLabel={t("arialabel.all")}
          checked={checked === "all"}
          value='all'
          onTabClick={allClick}
        >
          {t("tab.all")}
        </TabItem>
      </TabList>
      <TabPanel value='unread'>Unread</TabPanel>
      <TabPanel value='all'>All</TabPanel>
    </Tabs>
  )
}
