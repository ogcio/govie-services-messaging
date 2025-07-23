import {
  Button,
  FormField,
  Heading,
  Icon,
  IconButton,
  InputText,
  Pagination,
  Paragraph,
  Spinner,
  Stack,
  TabItem,
  TabList,
  Table,
  TableBody,
  TableData,
  TableHead,
  TableHeader,
  TableRow,
  TabPanel,
  Tabs,
  toaster,
} from "@govie-ds/react"
import { useAnalytics } from "@ogcio/nextjs-analytics"
import { useAsyncThrow } from "hooks/useAsyncThrow"
import { usePolling } from "hooks/usePolling"
import { useRouter, useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { useContext, useEffect, useMemo, useRef, useState } from "react"
import { defaultFormGap } from "utils/datetime"
import { addRecipient } from "@/app/[locale]/admin/send-a-message/addRecipient"
import { getRecipients } from "@/app/[locale]/admin/send-a-message/getRecipients"
import { BackButton } from "@/components/BackButton"
import { offsetToPage, pageToOffset } from "@/utils/pagination"
import { ANALYTICS } from "../../const/analytics"
import { FullWidthContainer } from "../containers"
import { SendMessageContext } from "./SendMessageContext"

const pageSize = 5
const retryTimeoutSeconds = 10
const pollingIntervalMs = 1000

export default function Recipients() {
  const { message, onStep, canCreateProfiles } = useContext(SendMessageContext)
  const tRecipient = useTranslations("message.wizard.step.recipient")
  const tSearch = useTranslations("search")
  const analyticsClient = useAnalytics()

  // biome-ignore lint/correctness/useExhaustiveDependencies: legacy
  useEffect(() => {
    analyticsClient.trackEvent({
      event: {
        name: ANALYTICS.message.stepRecipients.name,
        category: ANALYTICS.message.category,
        action: ANALYTICS.message.stepRecipients.action,
      },
    })
  }, [])

  const [selectedRecipients, setSelectedRecipients] = useState<
    { id: string; publicName: string; email: string }[]
  >([])
  // biome-ignore lint/suspicious/noExplicitAny: legacy
  const [users, setUsers] = useState<any[]>([])

  const [isAdding, setIsAdding] = useState<boolean>(false)

  const asyncThrow = useAsyncThrow()

  const metaRef = useRef<{ pages: number }>({
    pages: 0,
  })

  const searchParams = useSearchParams()
  const router = useRouter()

  const onNextStep = useMemo(() => {
    return async (e: React.ChangeEvent<HTMLFormElement>) => {
      e.preventDefault()

      return onStep(
        {
          ...message,
          userIds: selectedRecipients.map((item) => item.id),
        },
        "next",
      )
    }
  }, [message, onStep, selectedRecipients])

  const fetchRecipients = async (searchParams: URLSearchParams) => {
    try {
      const firstNameSearch = searchParams.get("firstName")?.toString()
      const surnameSearch = searchParams.get("surname")?.toString()
      const emailSearch = searchParams.get("email")?.toString()

      const {
        data: users,
        metadata,
        error,
      } = await getRecipients({
        queryParams: {
          limit: pageSize,
          offset: Number(searchParams.get("offset")) || 0,
          email: emailSearch,
          firstName: firstNameSearch,
          lastName: surnameSearch,
        },
      })

      if (error) {
        throw error
      }

      // The pages key indiciate which actual page in relative to total
      metaRef.current.pages =
        Number(
          Object.keys(metadata?.links?.pages || {})
            .sort((a, b) => Number(a) - Number(b))
            .at(-1),
        ) || 1
      setUsers(users)
    } catch {
      toaster.create({
        position: {
          x: "right",
          y: "top",
        },
        title: tRecipient("toast.error.databaseFetch"),
        dismissible: true,
        variant: "danger",
      })
    }
  }

  // biome-ignore lint/correctness/useExhaustiveDependencies: legacy
  useEffect(() => {
    fetchRecipients(searchParams)
  }, [searchParams])

  const handlePageChange = (page: number) => {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.set("offset", pageToOffset(page, pageSize).toString())
    router.push(`?${nextParams.toString()}`)
  }

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    const formData = new FormData(e.currentTarget)
    const firstNameSearch = formData.get("firstName") as string
    const surnameSearch = formData.get("surname") as string
    const emailSearch = formData.get("email") as string

    const nextParams = new URLSearchParams(searchParams)
    nextParams.set("firstName", firstNameSearch)
    nextParams.set("surname", surnameSearch)
    nextParams.set("email", emailSearch)
    nextParams.delete("offset")
    await fetchRecipients(nextParams)
    router.push(`?${nextParams.toString()}`)
  }

  const handleClearSearch = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault()
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete("offset")
    nextParams.delete("email")
    nextParams.delete("surname")
    nextParams.delete("firstName")
    const form = document.querySelector<HTMLFormElement>("form#searchform")
    for (const inp of form?.querySelectorAll("input") || []) {
      inp.value = ""
    }

    router.push(`?${nextParams.toString()}`)
  }

  const handleClearAdd = (e: React.FormEvent<HTMLButtonElement>) => {
    e.preventDefault()
    const form = document.querySelector<HTMLFormElement>("form#addform")
    for (const el of form?.querySelectorAll("input") || []) {
      el.value = ""
    }
  }

  const [newRecipient, setNewRecipient] = useState({
    firstName: "",
    lastName: "",
    email: "",
  })

  const retriesRef = useRef(retryTimeoutSeconds)

  const conditionFn = async () => {
    if (isAdding) {
      retriesRef.current -= 1
    }

    if (!retriesRef.current) {
      isAdding &&
        toaster.create({
          dismissible: true,
          position: {
            x: "right",
            y: "top",
          },
          variant: "danger",
          title: tRecipient("toast.error.timeout"),
        })
      setIsAdding(false)
    }
    return Boolean(retriesRef.current) && isAdding
  }

  const pollFn = async () => {
    try {
      const { email, firstName, lastName } = newRecipient
      const res = await getRecipients({
        queryParams: { search: email, limit: 1 },
      })

      if (res.error) {
        toaster.create({
          dismissible: true,
          position: {
            x: "right",
            y: "top",
          },
          variant: "danger",
          title: tRecipient("toast.error.add", {
            firstName,
            surname: lastName,
            email,
          }),
        })
        setIsAdding(false)
        return
      }

      const recipient = res.data?.at(0)

      if (!recipient) {
        return
      }

      setSelectedRecipients((state) => [
        {
          id: recipient.id,
          email: recipient.email,
          publicName: recipient.publicName,
        },
        ...state,
      ])

      toaster.create({
        dismissible: true,
        position: {
          x: "right",
          y: "top",
        },
        variant: "success",
        title: tRecipient("toast.success.add", {
          publicName: recipient.publicName,
          email: recipient.email,
        }),
      })

      setIsAdding(false)
      await fetchRecipients(searchParams)
    } catch (err) {
      asyncThrow(new Error(err))
    }
  }

  usePolling(conditionFn, pollFn, pollingIntervalMs)

  const handleAddRecipient = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    retriesRef.current = retryTimeoutSeconds
    const formData = new FormData(e.currentTarget)
    const firstName = formData.get("firstName") as string
    const surname = formData.get("surname") as string
    const email = formData.get("email") as string

    setIsAdding(true)
    setNewRecipient({
      email,
      firstName,
      lastName: surname,
    })

    try {
      const existanceCheck = await getRecipients({
        queryParams: { search: email, limit: 1 },
      })

      if (existanceCheck.data.length) {
        toaster.create({
          dismissible: true,
          position: {
            x: "right",
            y: "top",
          },
          variant: "danger",
          title: tRecipient("toast.error.emailExists", { email }),
        })
        setIsAdding(false)
        return
      }

      const { error } = await addRecipient({
        email,
        firstName,
        lastName: surname,
      })
      if (error) {
        toaster.create({
          dismissible: true,
          position: {
            x: "right",
            y: "top",
          },
          variant: "danger",
          title: tRecipient("toast.error.database"),
        })
        setIsAdding(false)
        return
      }
    } catch (err) {
      asyncThrow(new Error(err))
    }
  }

  return (
    <Stack direction='column' gap={defaultFormGap}>
      <Heading>{tRecipient("heading.main")}</Heading>
      <Paragraph whitespace='pre-wrap'>
        {tRecipient("paragraph.main")}
      </Paragraph>

      <FullWidthContainer>
        <Tabs ariaLabelledBy='something' id='pingpong'>
          <TabList>
            <TabItem value='s'>{tRecipient("tab.item.search")}</TabItem>
            {canCreateProfiles && (
              <TabItem value='a'>{tRecipient("tab.item.add")}</TabItem>
            )}
          </TabList>
          <TabPanel value='s'>
            <Stack direction='column' gap={defaultFormGap}>
              <form
                onSubmit={handleSearch}
                style={{ width: "100%" }}
                className='gi-flex gi-flex-wrap gi-gap-3 gi-items-end gi-w-100'
                id='searchform'
              >
                <div>
                  <FormField
                    label={{
                      text: tRecipient("label.firstName"),
                      htmlFor: "firstName",
                    }}
                  >
                    <InputText
                      type='text'
                      autoComplete='off'
                      defaultValue={searchParams.get("firstName") || ""}
                      name='firstName'
                      id='firstName'
                    />
                  </FormField>
                </div>
                <div>
                  <FormField
                    label={{
                      text: tRecipient("label.surname"),
                      htmlFor: "surname",
                    }}
                  >
                    <InputText
                      name='surname'
                      id='surname'
                      type='text'
                      autoComplete='off'
                    />
                  </FormField>
                </div>
                <div style={{ flexGrow: 1 }}>
                  <FormField
                    label={{
                      text: tRecipient("label.email"),
                      htmlFor: "email",
                    }}
                  >
                    <InputText
                      id='email'
                      name='email'
                      type='text'
                      autoComplete='off'
                    />
                  </FormField>
                </div>
                <Button type='submit'>{tSearch("button.search")}</Button>
                <Button
                  type='button'
                  variant='secondary'
                  onClick={handleClearSearch}
                >
                  {tSearch("button.reset")}
                </Button>
              </form>
              <Table layout='fixed'>
                <TableHead>
                  <TableRow>
                    <TableHeader>
                      {tRecipient("table.header.availableRecipients")}
                    </TableHeader>
                    <TableHeader>
                      {users.length ? tRecipient("table.header.actions") : ""}
                    </TableHeader>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.length ? (
                    users?.map((user) => (
                      <TableRow key={user.id}>
                        <TableData>{`${user.publicName} <${user.email}>`}</TableData>
                        <TableData>
                          <IconButton
                            disabled={selectedRecipients.some(
                              (rcp) => rcp.id === user.id,
                            )}
                            onClick={() => {
                              setSelectedRecipients([
                                {
                                  id: user.id,
                                  email: user.email,
                                  publicName: user.publicName,
                                },
                                ...selectedRecipients,
                              ])
                            }}
                            icon={{
                              icon: "add_circle",
                              ariaLabel: tRecipient(
                                "button.arialabel.addRecipient",
                              ),
                            }}
                            variant='flat'
                            size='large'
                            appearance='dark'
                          />
                        </TableData>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableData colSpan={2} className='gi-table-no-data'>
                        {tRecipient("table.empty")}
                      </TableData>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
              <Pagination
                currentPage={offsetToPage(
                  Number(searchParams.get("offset")) || 0,
                  Number(searchParams.get("limit")) || pageSize,
                )}
                onPageChange={
                  metaRef.current.pages ? handlePageChange : () => null
                }
                totalPages={metaRef.current.pages}
              />
            </Stack>
          </TabPanel>

          {canCreateProfiles && (
            <TabPanel value='a'>
              <form
                onSubmit={handleAddRecipient}
                style={{ width: "100%" }}
                className='gi-flex gi-flex-wrap gi-gap-3 gi-items-end gi-w-100'
                id='addform'
              >
                <div>
                  <FormField
                    label={{
                      text: tRecipient("label.firstName"),
                      htmlFor: "firstNameNew",
                    }}
                  >
                    <InputText
                      type='text'
                      autoComplete='off'
                      id='firstNameNew'
                      name='firstName'
                    />
                  </FormField>
                </div>
                <div>
                  <FormField
                    label={{
                      text: tRecipient("label.surname"),
                      htmlFor: "surnameNew",
                    }}
                  >
                    <InputText
                      id='surnameNew'
                      name='surname'
                      type='text'
                      autoComplete='off'
                    />
                  </FormField>
                </div>
                <div style={{ flexGrow: 1 }}>
                  <FormField
                    label={{
                      text: tRecipient("label.email"),
                      htmlFor: "emailNew",
                    }}
                  >
                    <InputText
                      name='email'
                      id='emailNew'
                      type='text'
                      autoComplete='off'
                    />
                  </FormField>
                </div>
                <Button type='submit' disabled={isAdding}>
                  {tRecipient("button.importUser")}
                  {isAdding ? <Spinner /> : <Icon icon='add_circle' />}
                </Button>
                <Button
                  type='button'
                  onClick={handleClearAdd}
                  variant='secondary'
                  disabled={isAdding}
                >
                  {tSearch("button.reset")}
                </Button>
              </form>
            </TabPanel>
          )}
        </Tabs>
      </FullWidthContainer>

      <Table layout='fixed'>
        <TableHead>
          <TableRow>
            <TableHeader>
              {tRecipient("table.header.selectedRecipients")}
            </TableHeader>
            <TableHeader>
              {selectedRecipients.length
                ? tRecipient("table.header.actions")
                : ""}
            </TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {selectedRecipients.length ? (
            selectedRecipients?.map((user) => (
              <TableRow key={user.id}>
                <TableData>{`${user.publicName} <${user.email}>`}</TableData>
                <TableData>
                  <IconButton
                    onClick={() => {
                      setSelectedRecipients(
                        selectedRecipients.filter((rcp) => rcp.id !== user.id),
                      )
                    }}
                    icon={{
                      icon: "delete",
                      ariaLabel: tRecipient("button.arialabel.removeRecipient"),
                    }}
                    variant='flat'
                    size='large'
                    appearance='dark'
                  />
                </TableData>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableData colSpan={2} className='gi-table-no-data'>
                {tRecipient("table.empty")}
              </TableData>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <form onSubmit={onNextStep}>
        <Button type='submit' disabled={!selectedRecipients.length}>
          {tRecipient("button.continue")}
        </Button>
      </form>

      <BackButton onClick={() => onStep(message, "previous")}>
        {tRecipient("button.back")}
      </BackButton>
    </Stack>
  )
}
