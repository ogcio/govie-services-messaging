import type { Page } from "@playwright/test"
import { expect, test } from "@playwright/test"
import { logout } from "e2e/utils/functions"
import { createAuthenticatedPage } from "../helpers/user-auth.helper"

let page: Page
const maxDiff = 0.02

test.describe("User Visual Regression", () => {
  test.beforeAll(async ({ browser }) => {
    page = await createAuthenticatedPage(browser, "e2e_citizen_1@user.com")
  })

  test.afterAll(async () => {
    await page.close()
  })

  test("home unread tab visual snapshot @visual", async () => {
    await page.goto("/")
    await expect(page).toHaveScreenshot("user-unread-tab.png", {
      fullPage: true,
      maxDiffPixelRatio: maxDiff,
    })
  })

  test("home all tab page visual snapshot @visual", async () => {
    await page.goto("/")
    await page.getByRole("tab", { name: "All" }).click()
    await expect(page).toHaveScreenshot("user-all-tab.png", {
      fullPage: true,
      maxDiffPixelRatio: maxDiff,
    })
  })

  test("profile page visual snapshot @visual", async () => {
    await page.goto("https://profile.dev.services.gov.ie")
    await expect(page).toHaveScreenshot("user-profile.png", {
      fullPage: true,
      maxDiffPixelRatio: maxDiff,
    })
  })

  test("dashboard page visual snapshot @visual", async () => {
    await page.goto("https://dashboard.dev.services.gov.ie/en/my-dashboard")
    await page.goto("https://dashboard.dev.services.gov.ie/en/my-dashboard")
    await expect(page).toHaveScreenshot("user-dashboard.png", {
      fullPage: true,
      maxDiffPixelRatio: maxDiff,
    })
  })

  test("login page visual snapshot @visual", async () => {
    await page.goto("https://profile.dev.services.gov.ie")
    await logout(page)
    await expect(page).toHaveScreenshot("user-login-page.png", {
      maxDiffPixelRatio: maxDiff,
    })
  })
})
