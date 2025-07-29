import { expect, type Page, test } from "@playwright/test"
import { goToDashboard } from "e2e/utils/functions"
import { authenticateUser } from "../helpers/auth"
import { createPageWithVideo } from "../helpers/browser-context"

let page: Page

test.describe("Admin Dashboard Features", () => {
  test.beforeAll(async ({ browser }) => {
    page = await createPageWithVideo(browser)
    await authenticateUser(page)
  })

  test.afterAll(async () => {
    await page.close()
  })

  test("an admin can view the dashboard @regression", async () => {
    await goToDashboard(page)
    await expect(
      page.getByRole("heading", { name: "Welcome back, E2E PublicServant" }),
    ).toBeVisible()
  })
})
