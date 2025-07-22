import { expect, type Page, test } from "@playwright/test"
import { navigateAndVerifyHeading } from "e2e/utils/navigation-helpers"
import { authenticateUser } from "../helpers/auth"
import { createPageWithVideo } from "../helpers/browser-context"

let authenticatedPage: Page

test.describe("Admin UI Features", () => {
  test.beforeAll(async ({ browser }) => {
    authenticatedPage = await createPageWithVideo(browser)
    await authenticateUser(authenticatedPage)
  })

  test.afterAll(async () => {
    await authenticatedPage.close()
  })

  test("after login an admin lands on the send a message page @smoke @regression", async () => {
    await navigateAndVerifyHeading(
      authenticatedPage,
      "/admin",
      "Send a message",
    )
  })

  test("Admin can view footer links @smoke @regression", async () => {
    await authenticatedPage.goto("/admin")
    await expect(
      authenticatedPage.getByRole("link", { name: "Privacy" }),
    ).toBeVisible()
    await expect(
      authenticatedPage.getByRole("link", { name: "Cookies" }),
    ).toBeVisible()
    await expect(
      authenticatedPage.getByRole("link", { name: "Accessibility statement" }),
    ).toBeVisible()
    await expect(
      authenticatedPage.getByRole("link", { name: "Terms of use" }),
    ).toBeVisible()
  })

  test("an admin can switch language @regression", async () => {
    await authenticatedPage.goto("/ga/admin")
    await expect(
      authenticatedPage.getByRole("heading", { name: "Seol teachtaireacht" }),
    ).toBeVisible()
  })
})
