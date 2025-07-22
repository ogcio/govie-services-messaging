import { expect, type Page, test } from "@playwright/test"
import { logout } from "e2e/utils/functions"
import { authenticateUser } from "../helpers/auth"
import { createPageWithVideo } from "../helpers/browser-context"

let authenticatedPage: Page

test.describe("Admin Profile Management", () => {
  test.beforeAll(async ({ browser }) => {
    authenticatedPage = await createPageWithVideo(browser)
    await authenticateUser(authenticatedPage)
  })

  test.afterAll(async () => {
    await authenticatedPage.close()
  })

  //functionality has been removed from the app
  // test("Admin can edit their profile @regression", async () => {
  //   await authenticatedPage.goto("https://profile-admin.dev.services.gov.ie/en")
  //   const uuid = crypto.randomUUID()
  //   await authenticatedPage
  //     .getByTestId("public-name-input")
  //     .fill(`E2E PublicServant User ${uuid}`)
  //   await clickButton(authenticatedPage, "Update")
  //   await authenticatedPage.reload()
  //   await expect(
  //     authenticatedPage.getByTestId("secondary-link-desktop-0"),
  //   ).toContainText(`E2E PublicServant User ${uuid}`)
  // })

  test("Admin can logout @smoke @regression", async () => {
    // Add a locator handler to automatically handle login page if it appears
    await authenticatedPage.addLocatorHandler(
      authenticatedPage.getByText("Sign in to your account"),
      async () => {
        await authenticateUser(authenticatedPage)
      },
      { times: 1 },
    )

    await authenticatedPage.goto("/admin")
    await authenticatedPage.waitForLoadState("domcontentloaded")

    await expect(
      authenticatedPage.getByRole("heading", { name: "Send a message" }),
    ).toBeVisible()
    await authenticatedPage.removeLocatorHandler(
      authenticatedPage.getByText("Sign in to your account"),
    )

    await logout(authenticatedPage)
  })

  // test("Admin can switch organisation @smoke @regression", async () => {
  //   await authenticatedPage.goto("/admin")
  //   await authenticatedPage.waitForLoadState("domcontentloaded")
  //   await authenticatedPage.getByText("Menumenuclose").click()
  //   await expect(authenticatedPage.getByLabel("Department")).toBeVisible()
  //   await authenticatedPage.selectOption(
  //     "#organization",
  //     "Second Testing Organisation",
  //   )
  //   //allow new header to render
  //   await authenticatedPage.waitForTimeout(500)
  //   await authenticatedPage.goto("/admin")
  //   await expect(
  //     authenticatedPage.getByText("Second Testing Organisation - Messaging"),
  //   ).toBeVisible()
  // })
})
