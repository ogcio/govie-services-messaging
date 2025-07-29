import { expect, type Page } from "@playwright/test"

const AUTH_URL = process.env.AUTH_URL || "http://localhost:3001"

export async function authenticateUser(page: Page) {
  // Go to the main page which will redirect to auth
  await page.goto("/")

  // Wait for redirect to auth service
  await page.waitForURL(`${AUTH_URL}`)

  // Click the MyGovID login button
  await page.getByRole("button", { name: "Continue with MyGovId" }).click()

  // Wait for the MyGovID mock login page
  await page.waitForURL(
    "https://mygovid-mock.dev.services.gov.ie/logto/mock/**",
  )

  // Fill in the login form
  await page.selectOption("select#user_select", "e2e_ps_1@user.com")
  await page.locator("[type=password]").fill("123")
  await page.keyboard.press("Enter")

  // Wait for the redirect chain to complete and return to messaging app
  await page.waitForURL("https://messaging.dev.services.gov.ie/en/**")
  await expect(page).toHaveURL(
    "https://messaging.dev.services.gov.ie/en/admin/send-a-message",
  )
}
