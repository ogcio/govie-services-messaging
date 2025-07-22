import "@govie-ds/theme-govie/theme.css"
import "@govie-ds/react/styles.css"
import type { PropsWithChildren } from "react"
import { IntlClientProvider } from "@/components/IntlClientProvider"

export default (props: PropsWithChildren) => {
  return <IntlClientProvider>{props.children}</IntlClientProvider>
}
