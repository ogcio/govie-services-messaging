import { getPublicServantOrRedirect } from "utils/auth"
import { sendAMessage } from "utils/routes"

export default async () => {
  await getPublicServantOrRedirect({
    redirectUserTo: "/home",
    redirectTo: sendAMessage.url,
  })
}
