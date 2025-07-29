import { expect, type Page, test } from "@playwright/test"
import {
  createAuthenticatedPage,
  loginAsCitizen,
} from "../helpers/user-auth.helper"
import { logout } from "../utils/functions"

let page: Page

test.describe("User Features", () => {
  test.beforeAll(async ({ browser }) => {
    page = await createAuthenticatedPage(browser, "e2e_citizen_1@user.com")
  })

  test.afterAll(async () => {
    await page.close()
  })

  test("a user can view footer links @smoke @regression", async () => {
    await page.goto("/")
    await expect(page.getByRole("link", { name: "Privacy" })).toBeVisible()
    await expect(page.getByRole("link", { name: "Cookies" })).toBeVisible()
    await expect(
      page.getByRole("link", { name: "Accessibility statement" }),
    ).toBeVisible()
    await expect(page.getByRole("link", { name: "Terms of use" })).toBeVisible()
  })

  test("a user can switch language @smoke @regression", async () => {
    await page.goto("/ga/admin")
    await expect(
      page.getByRole("heading", { name: "Teachtaireacht" }),
    ).toBeVisible()
  })

  test("a user can logout @smoke @regression", async () => {
    // Add a locator handler to automatically handle login page if it appears
    await page.addLocatorHandler(
      page.getByText("Sign in to your account"),
      async () => {
        await loginAsCitizen(page, "e2e_citizen_1@user.com")
      },
      { times: 1 },
    )

    await page.goto("/")
    await page.waitForLoadState("domcontentloaded")

    await page.goto("/en")
    await expect(page.getByRole("heading", { name: "Messaging" })).toBeVisible()
    await page.removeLocatorHandler(page.getByText("Sign in to your account"))
    await logout(page)
  })
})
