import { type Browser, expect, type Page } from "@playwright/test"
import { createPageWithVideo } from "./browser-context"

export async function loginAsCitizen(
  page: Page,
  citizenName: string,
): Promise<void> {
  // Go to the main page which will redirect to auth
  await page.goto("/")

  // Click the MyGovID login button
  await page.getByRole("button", { name: "Continue with MyGovId" }).click()

  // Fill in the login form
  await page.selectOption("select#user_select", citizenName)
  await page.locator("[type=password]").fill("123")
  await page.keyboard.press("Enter")

  // Wait for redirect to complete
  await expect(page).toHaveURL(/.*\/en\//)
}

export async function createAuthenticatedPage(
  browser: Browser,
  citizenName: string,
): Promise<Page> {
  const page = await createPageWithVideo(browser)
  await page.context().clearCookies()
  await loginAsCitizen(page, citizenName)
  return page
}
