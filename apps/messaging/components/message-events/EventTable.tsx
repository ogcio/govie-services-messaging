"use client"

import {
  Link,
  Spinner,
  Table,
  TableBody,
  TableData,
  TableHead,
  TableHeader,
  TableRow,
  toaster,
} from "@govie-ds/react"
import { usePathname, useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import { useEffect, useState } from "react"
import loader from "@/app/[locale]/admin/message-events/loader"
import { formatDate } from "@/utils/datetime"
import { isStatus } from "@/utils/messaging"
import { PAGINATION_LIMIT_DEFAULT } from "@/utils/pagination"
import { buildClientUrl } from "@/utils/url-utils.client"
import PaginationWrapper from "../PaginationWrapper"
import { MessageStatus } from "./MessageStatus"

export default function EventTable() {
  const t = useTranslations("event")
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const locale = useLocale()
  const [events, setEvents] = useState<
    Awaited<ReturnType<typeof loader>>["data"]
  >([])
  const [isFetching, setIsFetching] = useState(true)
  const [paging, setPaging] = useState<
    Awaited<ReturnType<typeof loader>>["paging"] | undefined
  >()

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    const doFetch = async () => {
      try {
        setIsFetching(true)
        const status = searchParams.get("status")?.toString()

        const { data, error, paging } = await loader({
          searchParams: {
            search: searchParams.get("search")?.toString() || undefined,
            dateFrom: searchParams.get("dateFrom")?.toString() || undefined,
            dateTo: searchParams.get("dateTo")?.toString() || undefined,
            page: Number(searchParams.get("page")) || undefined,
            size: Number(searchParams.get("size")) || undefined,
            status: isStatus(status) ? status : undefined,
          },
        })

        if (error) {
          throw error
        }

        setEvents(data)
        setPaging(paging)
      } catch (err) {
        toaster.create({
          title: t("toast.title.serverError"),
          action: { label: t("label.tryAgain"), href: pathname },
          dismissible: true,
          duration: 5000,
          position: { x: "right", y: "top" },
          variant: "danger",
        })
      } finally {
        setIsFetching(false)
      }
    }
    doFetch()
  }, [searchParams])

  return (
    <>
      <Table layout='fixed'>
        <TableHead>
          <TableRow>
            <TableHeader>{t("table.header.scheduled")}</TableHeader>
            <TableHeader className='sm-d-none'>
              {t("table.header.status")}
            </TableHeader>
            <TableHeader>{t("table.header.subject")}</TableHeader>
            <TableHeader className='sm-d-none'>
              {t("table.header.recipient")}
            </TableHeader>
            <TableHeader>{t("table.header.actions")}</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {!isFetching && !events.length && (
            <TableRow>
              <TableData colSpan={5}>{t("table.empty")}</TableData>
            </TableRow>
          )}
          {!isFetching &&
            events?.map(
              ({
                eventStatus,
                eventType,
                messageId,
                id,
                scheduledAt,
                receiverFullName,
                subject,
              }) => {
                return (
                  <TableRow key={messageId}>
                    <TableData>
                      {scheduledAt ? formatDate(scheduledAt) : "n/a"}
                    </TableData>
                    <TableData className='sm-d-none'>
                      <MessageStatus type={eventType} status={eventStatus} />
                    </TableData>
                    <TableData>{subject}</TableData>
                    <TableData className='sm-d-none'>
                      {" "}
                      {receiverFullName}
                    </TableData>
                    <TableData>
                      <Link
                        href={
                          buildClientUrl({
                            locale: "en",
                            url: `/admin/message-events/${id}?${searchParams.toString()}`,
                          }).href
                        }
                      >
                        {t("link.view")}
                      </Link>
                    </TableData>
                  </TableRow>
                )
              },
            )}
          {isFetching && (
            <TableRow>
              <TableData
                className='gi-table-loading gi-justify-items-center'
                colSpan={5}
              >
                <div className='gi-stroke-gray-950'>
                  <Spinner size='xl' />
                </div>
              </TableData>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {paging && paging.totalPages > 1 && !isFetching && (
        <PaginationWrapper
          currentPage={paging.currentPage}
          totalPages={paging.totalPages}
          size={PAGINATION_LIMIT_DEFAULT}
        />
      )}
    </>
  )
}
