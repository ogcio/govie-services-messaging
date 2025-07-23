import { requireActivePublicServant } from "utils/auth"

export default async () => {
  await requireActivePublicServant({
    redirectTo: "/admin",
    redirectUserTo: "/home",
    redirectInactiveTo: "/inactive-public-servant",
  })
}
