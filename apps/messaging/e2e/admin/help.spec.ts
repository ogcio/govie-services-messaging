import { type Page, test } from "@playwright/test"
import { authenticateUser } from "../helpers/auth"
import { createPageWithVideo } from "../helpers/browser-context"
import { navigateAndVerifyHeading } from "../utils/navigation-helpers"

let authenticatedPage: Page

test.describe("Admin Help Section", () => {
  test.beforeAll(async ({ browser }) => {
    authenticatedPage = await createPageWithVideo(browser)
    await authenticateUser(authenticatedPage)
  })

  test.afterAll(async () => {
    await authenticatedPage.close()
  })

  test("an admin can see the help page @smoke @regression", async () => {
    await navigateAndVerifyHeading(
      authenticatedPage,
      "/en/admin/help",
      "Welcome to messaging",
    )
  })
})
