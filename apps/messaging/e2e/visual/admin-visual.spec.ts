import { expect, type Page, test } from "@playwright/test"
import { goToDashboard } from "e2e/utils/functions"
import { authenticateUser } from "../helpers/auth"
import { createPageWithVideo } from "../helpers/browser-context"

let page: Page
const maxDiff = 0.02

test.describe("Admin Visual Regression", () => {
  test.beforeAll(async ({ browser }) => {
    page = await createPageWithVideo(browser)
    await authenticateUser(page)
  })

  test.afterAll(async () => {
    await page.close()
  })

  test("admin send a message page visual snapshot @visual", async () => {
    await page.goto("/en/admin")
    await expect(page).toHaveScreenshot("admin-send-message.png", {
      fullPage: true,
      maxDiffPixelRatio: maxDiff,
    })
  })

  test("admin message templates page visual snapshot @visual", async () => {
    await page.goto("/en/admin/message-templates")
    await expect(page).toHaveScreenshot("admin-message-templates.png", {
      mask: [await page.locator("table")],
      maskColor: "white",
      maxDiffPixelRatio: maxDiff,
    })
  })

  test("admin event log page visual snapshot @visual", async () => {
    await page.goto("/en/admin/message-events")
    await expect(page).toHaveScreenshot("admin-event-log.png", {
      mask: [
        await page.locator("table"),
        await page.getByRole("button", { name: "Go to page" }).last(),
      ],
      maskColor: "white",
      maxDiffPixelRatio: maxDiff,
    })
  })

  test("admin help page visual snapshot @visual", async () => {
    await page.goto("/en/admin/help")
    await expect(page).toHaveScreenshot("admin-help.png", {
      fullPage: true,
      maxDiffPixelRatio: maxDiff,
    })
  })

  test("admin profile page visual snapshot @visual", async () => {
    await page.goto("https://profile-admin.dev.services.gov.ie/en")
    await expect(page).toHaveScreenshot("admin-profile.png", {
      fullPage: true,
      maxDiffPixelRatio: maxDiff,
    })
  })

  test("admin dashboard page visual snapshot @visual", async () => {
    await goToDashboard(page)
    await expect(page).toHaveScreenshot("admin-dashboard.png", {
      fullPage: true,
      maxDiffPixelRatio: maxDiff,
    })
  })

  test("admin providers page visual snapshot @visual", async () => {
    await page.goto("/en/admin/providers")
    await expect(page).toHaveScreenshot("admin-providers.png", {
      fullPage: true,
      mask: [await page.locator("table")],
      maskColor: "white",
      maxDiffPixelRatio: maxDiff,
    })
  })

  test("admin service users page visual snapshot @visual", async () => {
    await page.goto(
      "https://profile-admin.dev.services.gov.ie/en/service-users",
    )
    //wait for page to fully load to stop flakiness
    await page.waitForLoadState("domcontentloaded")
    await expect(page).toHaveScreenshot("admin-service-users.png", {
      mask: [
        await page.locator("table"),
        await page.getByRole("button", { name: "Go to page" }).last(),
      ],
      maskColor: "white",
      maxDiffPixelRatio: maxDiff,
    })
  })

  test("admin service users page Imports tab visual snapshot @visual", async () => {
    await page.goto(
      "https://profile-admin.dev.services.gov.ie/en/service-users",
    )
    await page.getByText("Imports").click()
    await expect(page).toHaveScreenshot("admin-service-users-imports.png", {
      fullPage: true,
      mask: [await page.locator("table")],
      maskColor: "white",
      maxDiffPixelRatio: maxDiff,
    })
  })

  test("admin service users page Import CSV tab visual snapshot @visual", async () => {
    await page.goto(
      "https://profile-admin.dev.services.gov.ie/en/service-users",
    )
    await page.getByText("Import CSV").click()
    await expect(page).toHaveScreenshot("admin-service-users-import-csv.png", {
      fullPage: true,
      mask: [await page.locator("table")],
    })
  })
})
