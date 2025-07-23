"use client"

import {
  Button,
  FormField,
  IconButton,
  Link,
  ModalBody,
  ModalFooter,
  ModalTitle,
  ModalWrapper,
  Paragraph,
  Spinner,
  Stack,
  Table,
  TableBody,
  TableData,
  TableHead,
  TableHeader,
  TableRow,
  TextInput,
  toaster,
} from "@govie-ds/react"
import { useAnalytics } from "@ogcio/nextjs-analytics"
import { getCommonLogger } from "@ogcio/nextjs-logging-wrapper/common-logger"
import { ANALYTICS } from "const/analytics"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useLocale, useTranslations } from "next-intl"
import {
  type ChangeEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react"
import { useFormState } from "react-dom"
import { templateRoutes } from "utils/routes"
import {
  buildClientUrl,
  buildClientUrlWithSearchParams,
} from "utils/url-utils.client"
import { handleDeleteAction } from "@/app/[locale]/admin/message-templates/deleteAction"
import { getTemplates } from "@/app/[locale]/admin/message-templates/getTemplates"
import { FullWidthContainer, TwoColumnLayout } from "../containers"

const deleteToDefault = Object.freeze({
  id: "",
  name: "",
})

export default function TemplatesList() {
  const t = useTranslations("template")
  const tSearch = useTranslations("search")
  const locale = useLocale()
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const router = useRouter()
  const logger = useCallback(() => getCommonLogger("error"), [])
  const analyticsClient = useAnalytics()

  const [templates, setTemplates] = useState<
    Awaited<ReturnType<typeof getTemplates>>
  >([])

  const [toDelete, setToDelete] = useState<{ id: string; name: string }>(
    deleteToDefault,
  )
  const [state, deleteAction] = useFormState(handleDeleteAction, {
    error: undefined,
  })
  const [isFetching, setIsFetching] = useState(true)

  const [searchText, setSearchText] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)

  // biome-ignore lint/correctness/useExhaustiveDependencies: legacy
  const doFetch = useCallback(async (search?: string) => {
    try {
      setIsFetching(true)
      const templates = await getTemplates({ search })
      setTemplates(templates)
    } catch (error) {
      logger().error(error)
      toaster.create({
        title: t("toaster.title.serverError"),
        dismissible: true,
        duration: 10000,
        action: {
          href: pathname,
          label: t("toaster.action.retry"),
        },
        variant: "danger",
        position: { x: "right", y: "top" },
      })
    } finally {
      setIsFetching(false)
    }
  }, [])

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchText(e.target.value)
  }

  const handleTextSearch = async () => {
    await doFetch(searchText)
  }

  const handleTextReset = async () => {
    setSearchText("")
    await doFetch()
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: legacy
  useEffect(() => {
    doFetch()
  }, [])

  // biome-ignore lint/suspicious/noExplicitAny: needed for unknown
  const anyState = state as any
  const lastDeletedId = useRef<string | undefined>()
  useEffect(() => {
    if (
      anyState.deletedId &&
      toDelete.id &&
      anyState.deletedId !== lastDeletedId.current
    ) {
      lastDeletedId.current = anyState.deletedId
      setIsDeleting(false)
      setTemplates((prev) => prev?.filter((t) => t.id !== toDelete.id))
      setToDelete(deleteToDefault)
    }
  }, [anyState.deletedId, toDelete.id])

  useEffect(() => {
    if (anyState.error) {
      setIsDeleting(false)
    }
  }, [anyState.error])

  const newid = searchParams.get("newid")
  const triggeredToaster = useRef(false)

  // go to send a message with created template pre-filled effect
  // biome-ignore lint/correctness/useExhaustiveDependencies: legacy
  useEffect(() => {
    if (newid && !triggeredToaster.current && templates?.length) {
      const newTemplateName = templates
        .find((t) => t.id === newid)
        ?.contents.find((c) => c.language === locale || true)?.templateName
      toaster.create({
        title: t("toaster.title.newTemplate", {
          name: newTemplateName ? ` '${newTemplateName}'` : "",
        }),
        dismissible: true,
        duration: 10000,
        action: {
          href: `/${locale}/admin/send-a-message?templateId=${newid}`,
          label: t("toaster.action.yes"),
        },
        variant: "success",
        position: { x: "right", y: "top" },
      })
      triggeredToaster.current = true
      router.replace(pathname)
    }
  }, [newid, templates?.length])

  const handleDeleteClick = () => {
    setIsDeleting(true)
    const payload = new FormData()
    payload.set("id", toDelete.id)
    deleteAction(payload)
  }

  return (
    <>
      <ModalWrapper
        isOpen={Boolean(toDelete.id)}
        onClose={() => setToDelete(deleteToDefault)}
      >
        <ModalTitle>
          {t("modal.delete.title", { name: toDelete.name })}
        </ModalTitle>
        <ModalBody>
          {anyState.error && (
            <FormField error={{ text: t("modal.delete.error") }} />
          )}
          <Paragraph>{t("modal.delete.body")}</Paragraph>
        </ModalBody>
        <ModalFooter>
          <Button
            disabled={isDeleting}
            variant='secondary'
            onClick={() => {
              setToDelete(deleteToDefault)
            }}
          >
            {t("button.cancel")}
          </Button>
          <Button disabled={isDeleting} onClick={handleDeleteClick}>
            {t("button.delete")} {isDeleting && <Spinner />}
          </Button>
        </ModalFooter>
      </ModalWrapper>

      <FullWidthContainer>
        <TwoColumnLayout>
          <Stack direction='column'>
            <Stack direction='row' gap={3}>
              <TextInput
                name='search'
                placeholder={tSearch("input.placeholder")}
                onChange={handleSearchChange}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleTextSearch()
                  }
                }}
                value={searchText}
                autoComplete='off'
              />
              <Button type='submit' onClick={handleTextSearch}>
                {tSearch("button.search")}
              </Button>
              <Button
                type='button'
                onClick={handleTextReset}
                variant='secondary'
              >
                {tSearch("button.reset")}
              </Button>
            </Stack>
          </Stack>

          <Stack itemsAlignment='end'>
            <Link
              asButton={{
                appearance: "default",
              }}
              noUnderline
              href={
                buildClientUrl({
                  locale: locale,
                  url: templateRoutes.url,
                }).href
              }
              onClick={() =>
                analyticsClient.trackEvent({
                  event: {
                    name: ANALYTICS.template.create.name,
                    category: ANALYTICS.template.category,
                    action: ANALYTICS.template.create.action,
                  },
                })
              }
            >
              {t("button.new")}
            </Link>
          </Stack>
        </TwoColumnLayout>
      </FullWidthContainer>

      <Table layout='fixed'>
        <TableHead>
          <TableRow>
            <TableHeader>{t("table.header.name")}</TableHeader>
            <TableHeader>{t("table.header.languages")}</TableHeader>
            <TableHeader>{t("table.header.actions")}</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {isFetching && (
            <TableRow>
              <TableData
                className='gi-table-loading gi-justify-items-center'
                colSpan={3}
              >
                <div className='gi-stroke-gray-950'>
                  <Spinner size='xl' />
                </div>
              </TableData>
            </TableRow>
          )}
          {!templates?.length && !isFetching && (
            <TableRow>
              <TableData colSpan={3}>{t("table.empty")}</TableData>
            </TableRow>
          )}
          {!isFetching &&
            templates?.map((template) => {
              const templateName =
                template.contents.find((content) => content.language === locale)
                  ?.templateName ||
                template.contents.at(0)?.templateName ||
                ""
              return (
                <TableRow key={template.id}>
                  <TableHeader>{templateName}</TableHeader>

                  <TableData>
                    {template.contents
                      .map((content) => content.language.toUpperCase())
                      .sort()
                      .join(", ")}
                  </TableData>
                  <TableData>
                    <Stack direction='row' gap={3} itemsAlignment='center'>
                      <Link
                        href={
                          buildClientUrlWithSearchParams({
                            locale: locale,
                            dir: templateRoutes.url,
                            searchParams: { id: template.id },
                          }).href
                        }
                        onClick={() =>
                          analyticsClient.trackEvent({
                            event: {
                              name: ANALYTICS.template.edit.name,
                              category: ANALYTICS.template.category,
                              action: ANALYTICS.template.edit.action,
                            },
                          })
                        }
                      >
                        {t("table.link.edit")}
                      </Link>
                      <Link
                        onClick={() =>
                          analyticsClient.trackEvent({
                            event: {
                              name: ANALYTICS.template.preview.name,
                              category: ANALYTICS.template.category,
                              action: ANALYTICS.template.preview.action,
                            },
                          })
                        }
                        href={`/${locale}/admin/send-a-message?templateId=${template.id}`}
                      >
                        {t("table.link.use")}
                      </Link>
                      <IconButton
                        icon={{ icon: "delete" }}
                        size='large'
                        appearance='dark'
                        variant='flat'
                        onClick={() => {
                          analyticsClient.trackEvent({
                            event: {
                              name: ANALYTICS.template.delete.name,
                              category: ANALYTICS.template.category,
                              action: ANALYTICS.template.delete.action,
                            },
                          })
                          setToDelete({ id: template.id, name: templateName })
                        }}
                      />
                    </Stack>
                  </TableData>
                </TableRow>
              )
            })}
        </TableBody>
      </Table>
    </>
  )
}
