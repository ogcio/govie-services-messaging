"use client"

import {
  Icon,
  Link,
  Table,
  TableBody,
  TableData,
  TableHead,
  TableHeader,
  TableRow,
} from "@govie-ds/react"
import { useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import PaginationWrapper from "@/components/PaginationWrapper"
import { formatDate } from "@/utils/datetime"
import { buildClientUrlWithSearchParams } from "@/utils/url-utils.client"
import loader from "../../app/[locale]/home/loader"
import { TableDataPlaceholder } from "./TableDataPlaceholder"

export function parseTab(s?: string): "all" | "unread" {
  switch (s) {
    case "all":
      return "all"
    default:
      return "unread"
  }
}

export function MessageTable() {
  const searchParams = useSearchParams()
  const t = useTranslations("home")
  const locale = useLocale()
  const [state, setState] = useState<{
    data: {
      id: string
      subject: string
      createdAt: string
      threadName: string
      organisationId: string
      recipientUserId: string
      attachmentsCount: number
    }[]
    isLoading: boolean
    pagesCount: number
    currentHeight: number
  }>({ data: [], isLoading: true, pagesCount: 0, currentHeight: 0 })

  const tab = parseTab(searchParams.get("tab")?.toString())
  const offset = Number(searchParams.get("page")?.toString())
  const search = searchParams.get("search")?.toString()

  useEffect(() => {
    setState((state) => ({
      ...state,
      isLoading: true,
      currentHeight:
        document.querySelector("#table-body")?.getBoundingClientRect().height ||
        0,
    }))

    const doFetch = async () => {
      const { data, error, metadata } = await loader({
        searchParams: {
          tab,
          search,
          offset: Number.isNaN(offset) ? undefined : offset,
        },
      })
      setState((state) => ({
        ...state,
        data,
        isLoading: false,
        pagesCount: Math.ceil((metadata?.totalCount || 0) / 10),
      }))
    }

    doFetch()
  }, [tab, offset, search])

  return (
    <>
      <Table layout='fixed'>
        <TableHead>
          <TableRow>
            <TableHeader style={{ width: "150px" }}>
              {t("table.column.date")}
            </TableHeader>
            <TableHeader align='left'>{t("table.column.details")}</TableHeader>
            <TableHeader align='right'>
              {t("table.column.attachment")}
            </TableHeader>
          </TableRow>
        </TableHead>
        <TableBody id='table-body'>
          {state.isLoading && state.currentHeight > 0 ? (
            <TableRow width='100%'>
              <TableDataPlaceholder tableBodyHeight={state.currentHeight} />
            </TableRow>
          ) : state.data?.length ? (
            state.data.map((message) => (
              <TableRow key={message.id}>
                <TableData align='left'>
                  {formatDate(message.createdAt, "D MMM YYYY")}
                </TableData>
                <TableData align='left' style={{ overflowWrap: "anywhere" }}>
                  <Link
                    href={((messageId) => {
                      return buildClientUrlWithSearchParams({
                        locale,
                        dir: `/home/${messageId}`,
                        searchParams: {
                          tab,
                        },
                      }).href
                    })(message.id)}
                  >
                    {message.subject}
                  </Link>
                </TableData>
                <TableData align='right'>
                  {message.attachmentsCount ? (
                    <Icon icon='attach_file' />
                  ) : null}
                </TableData>
              </TableRow>
            ))
          ) : (
            !state.isLoading && (
              <TableRow>
                <TableData colSpan={3}>{t("table.empty")}</TableData>
              </TableRow>
            )
          )}
        </TableBody>
      </Table>
      {state.pagesCount > 1 && (
        <PaginationWrapper
          currentPage={offset || 0}
          totalPages={state.pagesCount}
          size={10}
        />
      )}
    </>
  )
}
