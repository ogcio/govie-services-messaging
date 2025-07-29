import { expect, type Page } from "@playwright/test"
import { TEST_DATA } from "./consts"
import { generateTestData } from "./functions"

export async function createProvider(page: Page) {
  await page.goto("/en/admin/providers/email")

  const { timestamp } = generateTestData()
  const providerName = `Playwright Provider name ${timestamp}`
  const providerEmail = `playwrightprovideremail${crypto.randomUUID()}@nearform.com`

  await page.getByRole("textbox", { name: "Provider name" }).fill(providerName)
  await page.getByRole("textbox", { name: "From address" }).fill(providerEmail)
  await page.getByRole("textbox", { name: "Host" }).fill(TEST_DATA.providerHost)
  await page.getByRole("textbox", { name: "Port" }).fill("1234")
  await page.getByRole("textbox", { name: "Username" }).fill(providerName)
  await page
    .getByRole("textbox", { name: "Password" })
    .fill(TEST_DATA.providerTestValue)
  await page.getByRole("button", { name: "Create" }).click()

  return { providerName, providerEmail }
}

export async function deleteProvider(page: Page, providerName: string) {
  await page
    .getByRole("row", { name: providerName })
    .locator("button")
    .last()
    .click()
  await page.getByRole("button", { name: "Delete", exact: true }).click()
  await expect(page.getByRole("cell", { name: providerName })).not.toBeVisible()
}
