import type { Page } from "@playwright/test"
import { generateTestData } from "./functions"

export async function addNewRecipient(page: Page) {
  const { uuid } = generateTestData()
  const recipientEmail = `email${uuid}@nearform.com`
  const recipientName = `Name${Date.now()}`
  const recipientSurname = `Surname${Date.now()}`

  await page.getByText("Add new").click()
  await page
    .getByRole("tabpanel", { name: "Add new" })
    .locator('input[name="firstName"]')
    .fill(recipientName)
  await page
    .getByRole("tabpanel", { name: "Add new" })
    .locator('input[name="surname"]')
    .fill(recipientSurname)
  await page
    .getByRole("tabpanel", { name: "Add new" })
    .locator('input[name="email"]')
    .fill(recipientEmail)
  await page.getByRole("button", { name: "Add" }).click()

  return { recipientEmail, recipientName, recipientSurname }
}
