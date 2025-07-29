"use server"

import type { Messaging } from "@ogcio/building-blocks-sdk/dist/types"
import { PAGINATION_LIMIT_DEFAULT } from "utils/pagination"
import { BBClients } from "@/utils/building-blocks-sdk"

export default async (params: {
  searchParams: {
    search?: string
    dateFrom?: string
    dateTo?: string
    page?: number
    size?: number
    status?: NonNullable<Parameters<Messaging["getMessageEvents"]>[0]>["status"]
  }
}) => {
  const search = params.searchParams.search
  const dateFrom = params.searchParams.dateFrom
  const dateTo = params.searchParams.dateTo
  const page = Number(params.searchParams.page) || 0
  const size = Math.max(
    1,
    Number(params.searchParams.size) || PAGINATION_LIMIT_DEFAULT,
  )

  const client = BBClients.getMessagingClient()

  const { data, error, metadata } = await client.getMessageEvents({
    search,
    dateFrom,
    dateTo,
    limit: size.toString(10),
    offset: (page * size).toString(10),
    status: params.searchParams.status,
  })
  const paging = pagingMeta(metadata?.totalCount || 0, page, size)

  return { data, error, metadata, paging }
}

function pagingMeta(count: number, page: number, size: number) {
  const totalPages = Math.ceil(count / size) || 1
  const currentPage = Math.min(Math.max(0, page), totalPages)

  return {
    totalPages,
    currentPage,
  }
}

export type PagingMeta = ReturnType<typeof pagingMeta>
