import { UserContextHandler } from "@ogcio/nextjs-auth"
import { getCommonLogger } from "@ogcio/nextjs-logging-wrapper/common-logger"
import { getLogtoContextParams, getSignInConfiguration } from "./logto-config"

export const AuthenticationFactory = {
  getInstance: (organizationId?: string): UserContextHandler => {
    return new UserContextHandler(
      getSignInConfiguration(),
      getLogtoContextParams(organizationId),
      getCommonLogger(),
    )
  },
}
