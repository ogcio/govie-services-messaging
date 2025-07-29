import { NextIntlClientProvider, useMessages } from "next-intl"

const IntlClientProvider = ({ children }) => {
  const messages = useMessages()
  return (
    <NextIntlClientProvider messages={messages}>
      {children}
    </NextIntlClientProvider>
  )
}

export { IntlClientProvider }
