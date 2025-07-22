import { expect, type Page, test } from "@playwright/test"
import { navigateAndVerifyHeading } from "e2e/utils/navigation-helpers"
import { createAuthenticatedPage } from "../helpers/user-auth.helper"

let page: Page

test.describe("User Messaging page", () => {
  test.beforeAll(async ({ browser }) => {
    page = await createAuthenticatedPage(browser, "peter.parker@mail.ie")
  })

  test.afterAll(async () => {
    await page.close()
  })

  test("a user can open a message @smoke @regression", async () => {
    await navigateAndVerifyHeading(page, "/en/home?tab=all", "Messaging")
    await page.getByRole("textbox", { name: "Search" }).fill("test")
    await page.getByRole("button", { name: "Search" }).click()
    await page.getByRole("link", { name: "test" }).first().click()
    await expect(page.getByRole("heading", { name: "test" })).toBeVisible()
    await expect(
      page
        .locator('iframe[title="Secure email content viewer"]')
        .contentFrame()
        .getByText("Test rich text"),
    ).toBeVisible()
  })

  test("a user can open a message attachment @smoke @regression", async () => {
    await page.goto("en/home/becb3e86-6a5c-48e1-8bf7-c1cb884df69c?tab=all")
    //this next page is now in a new tab so we need to get the new page
    const [newPage] = await Promise.all([
      page.context().waitForEvent("page"),
      page.getByRole("link", { name: "test123.txt" }).click(),
    ])
    await newPage.waitForLoadState("domcontentloaded")
    await expect(newPage.url()).toContain(
      "/api/file/ce198559-649b-419e-84bf-a97e19b5d577",
    )
    await expect(newPage.getByText("46546546546546")).toBeVisible()
  })

  test("a user can access a recent message from the dashboard @smoke @regression", async () => {
    await page.goto("https://dashboard.dev.services.gov.ie/en/my-dashboard")
    await expect(
      page.getByRole("heading", { name: "Welcome back, Toby Tobyson" }),
    ).toBeVisible()
    //wait for no new messages to be removed
    await page.waitForSelector("text=No new messages", { state: "detached" })
    await page.getByRole("region").getByRole("link").first().click()
    await expect(page.url()).toContain("messaging.dev.services.gov.ie/en/home/")
    await expect(page.getByRole("link", { name: "Back" })).toBeVisible()
  })
})
