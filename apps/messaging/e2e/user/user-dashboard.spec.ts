import { expect, type Page, test } from "@playwright/test"
import { createAuthenticatedPage } from "../helpers/user-auth.helper"

let page: Page

test.describe("User Dashboard Features", () => {
  test.beforeAll(async ({ browser }) => {
    page = await createAuthenticatedPage(browser, "e2e_citizen_1@user.com")
  })

  test.afterAll(async () => {
    await page.close()
  })

  test("a user can view the dashboard @smoke @regression", async () => {
    await page.goto("https://dashboard.dev.services.gov.ie/en/my-dashboard")
    await expect(
      page.getByRole("heading", { name: "Welcome back, E2E Citizen User" }),
    ).toBeVisible()
    await expect(page.getByText("Your messages")).toBeVisible()
    await expect(
      page.getByRole("button", { name: "View all messages" }),
    ).toBeVisible()
  })

  test("clicking view all messages will take the user to the messaging page @regression", async () => {
    await page.goto("https://dashboard.dev.services.gov.ie/en/my-dashboard")
    await expect(
      page.getByRole("heading", { name: "Welcome back, E2E Citizen User" }),
    ).toBeVisible()
    await expect(page.getByText("Your messages")).toBeVisible()
    await page.getByRole("button", { name: "View all messages" }).click()
    await expect(page.getByRole("heading", { name: "Messaging" })).toBeVisible()
  })
})
