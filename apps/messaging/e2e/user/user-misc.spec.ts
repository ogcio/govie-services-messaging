import { expect, type Page, test } from "@playwright/test"
import { createAuthenticatedPage } from "../helpers/user-auth.helper"

let page: Page

test.describe("User Misc tests", () => {
  test.beforeAll(async ({ browser }) => {
    page = await createAuthenticatedPage(browser, "e2e_citizen_1@user.com")
  })

  test.afterAll(async () => {
    await page.close()
  })

  test("a user cannot open another users attachment @smoke @regression", async () => {
    //check that this user cannot access another users attachment
    await page.goto("/api/file/ce198559-649b-419e-84bf-a97e19b5d577")
    await expect(page.getByText("Error")).toBeVisible()
    await expect(page.getByText("46546546546546")).not.toBeVisible()
  })

  // test("a non onboarded user is redirected to the onboarding page @smoke @regression", async () => {
  //   await logout(page)
  //   // Click the MyGovID login button
  //   await page.getByRole("button", { name: "Continue with MyGovId" }).click()
  //   // Fill in the login form without username to log in as a random user
  //   await page.locator("[type=password]").fill("123")
  //   await page.keyboard.press("Enter")
  //   await page.waitForLoadState("networkidle")
  //   await expect(page.url()).toContain("/onboarding")
  // })
})
