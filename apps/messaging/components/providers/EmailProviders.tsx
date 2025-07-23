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
  Table,
  TableBody,
  TableData,
  TableHead,
  TableHeader,
  TableRow,
  toaster,
} from "@govie-ds/react"
import { getCommonLogger } from "@ogcio/nextjs-logging-wrapper/common-logger"
import { useLocale, useTranslations } from "next-intl"
import { useCallback, useEffect, useRef, useState } from "react"
import { useFormState } from "react-dom"
import { providerRoutes } from "utils/routes"
import { buildClientUrlWithSearchParams } from "utils/url-utils.client"
import { handleDeleteAction } from "@/app/[locale]/admin/providers/deleteEmailProvider"
import { getEmailProviders } from "@/app/[locale]/admin/providers/getEmailProviders"

const deleteToDefault: { id: string; name: string } = Object.freeze({
  id: "",
  name: "",
})

export default () => {
  const logger = useCallback(() => {
    return getCommonLogger("error")
  }, [])
  const t = useTranslations("settings.Emails")
  const locale = useLocale()
  const [providers, setProviders] = useState<
    Awaited<ReturnType<typeof getEmailProviders>> | undefined
  >()
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [toDelete, setToDelete] =
    useState<typeof deleteToDefault>(deleteToDefault)
  const [providerFetchError, setProviderFetchError] = useState<
    string | undefined
  >()
  const [isDeleting, setIsDeleting] = useState(false)

  const [state, deleteAction] = useFormState(handleDeleteAction, {
    error: undefined,
    deletedId: "",
  })

  // biome-ignore lint/correctness/useExhaustiveDependencies: legacy
  useEffect(() => {
    const doFetch = async () => {
      try {
        const providers = await getEmailProviders()
        setProviders(providers)
      } catch (error) {
        logger().error(error)
        setProviderFetchError(t("genericServerError"))
      }
    }

    doFetch()
  }, [])

  const lastDeletedId = useRef("")
  useEffect(() => {
    if (
      state.deletedId &&
      lastDeletedId.current !== state.deletedId &&
      providers
    ) {
      lastDeletedId.current = state.deletedId
      setProviders((prev) => prev?.filter((t) => t.id !== state.deletedId))
      setToDelete(deleteToDefault)
      setDeleteModalOpen(false)
      setIsDeleting(false)
    }
  }, [state.deletedId, providers])

  // biome-ignore lint/correctness/useExhaustiveDependencies: legacy
  useEffect(() => {
    if (providerFetchError) {
      toaster.create({
        title: t("genericServerError"),
        position: {
          x: "right",
          y: "top",
        },
        variant: "danger",
      })
      setIsDeleting(false)
    }
  }, [providerFetchError])

  const handleDeleteClick = () => {
    setIsDeleting(true)
    const payload = new FormData()
    payload.set("id", toDelete.id)
    deleteAction(payload)
  }

  return (
    <>
      <ModalWrapper
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
      >
        <ModalTitle>
          {t("deleteModalTitle", { name: toDelete.name })}
        </ModalTitle>
        <ModalBody>
          <FormField
            error={state.error ? { text: t("failedToDelete") } : undefined}
          />
          <Paragraph>{t("deleteModalBody")}</Paragraph>
        </ModalBody>

        <ModalFooter>
          <Button
            variant='secondary'
            onClick={() => {
              setToDelete(deleteToDefault)
              setDeleteModalOpen(false)
            }}
            disabled={isDeleting}
          >
            {t("modalCancel")}
          </Button>

          <Button
            variant='primary'
            onClick={handleDeleteClick}
            disabled={isDeleting}
          >
            {t("modalDelete")} {isDeleting && <Spinner />}
          </Button>
        </ModalFooter>
      </ModalWrapper>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeader>{t("nameTableHeader")}</TableHeader>
            <TableHeader>{t("primaryHeader")}</TableHeader>
            <TableHeader>{t("linksTableHeader")}</TableHeader>
            <TableHeader>{t("actionsTableHeader")}</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {providerFetchError && (
            <TableRow>
              <TableData colSpan={4}>{t("genericServerError")}</TableData>
            </TableRow>
          )}
          {providers?.length === 0 && (
            <TableRow>
              <TableData colSpan={4}>{t("noProviders")}</TableData>
            </TableRow>
          )}
          {providers?.map((provider) => (
            <TableRow key={provider.id}>
              <TableHeader>{provider.providerName}</TableHeader>

              <TableData>
                {provider.isPrimary && t("primaryCellValue")}
              </TableData>

              <TableData>
                <Link
                  href={(() => {
                    return buildClientUrlWithSearchParams({
                      dir: `${locale}/${providerRoutes.url}/email`,
                      searchParams: { id: provider.id },
                    }).href
                  })()}
                >
                  {t("editLink")}
                </Link>
              </TableData>

              <TableData>
                <IconButton
                  icon={{ icon: "delete" }}
                  appearance='dark'
                  variant='flat'
                  size='large'
                  onClick={() => {
                    setToDelete({
                      id: provider.id,
                      name: provider.providerName,
                    })
                    setDeleteModalOpen(true)
                  }}
                />
              </TableData>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </>
  )
}
