import { expect, type Page } from "@playwright/test"
import { WAIT_TIME } from "./consts"
import { sendMessageAndVerify } from "./message-helpers"
import { navigateAndVerifyHeading } from "./navigation-helpers"

export const generateTestData = () => ({
  uuid: crypto.randomUUID(),
  timestamp: Date.now(),
})

export async function sendE2ETemplateMessage(page: Page, nonSecure = false) {
  await navigateAndVerifyHeading(
    page,
    "/en/admin/message-templates",
    "Message templates",
  )

  await page.getByRole("textbox", { name: "Search" }).fill("E2E Template")
  await page.getByText("Search").click()
  await page.waitForTimeout(WAIT_TIME)
  await expect(page.getByRole("cell", { name: "E2E Template" })).toBeVisible()
  await page.getByRole("link", { name: "Use this template" }).first().click()
  //if nonsecure message click button
  if (nonSecure) {
    await page.getByRole("radio", { name: "Non-secured" }).click()
  }
  await clickButton(page, "Continue to recipients")
}

export async function searchByText(
  page: Page,
  searchText: string,
  searchButtonName = "Search",
) {
  await page.getByRole("textbox", { name: "Search" }).fill(searchText)
  await page.getByRole("button", { name: searchButtonName }).click()
  await page.waitForTimeout(WAIT_TIME)
}

export async function clickButton(page: Page, buttonName: string) {
  await page.getByRole("button", { name: buttonName }).click()
}

export async function logout(page: Page) {
  await page.goto("/signout")
  await expect(page).toHaveURL(/.*\/global-signout/)
  await expect(page.getByText("We’re logging you out")).toBeVisible()
  await expect(page.getByText("We’re logging you out")).toBeHidden()
  await expect(page.getByText("Sign in to your account")).toBeVisible({
    timeout: 15000,
  })
}

export async function goToDashboard(page: Page) {
  await page.goto("https://dashboard-admin.dev.services.gov.ie")
}

export async function sendMessageToDevCitizen(page: Page, nonSecure = false) {
  await navigateAndVerifyHeading(
    page,
    "/en/admin/send-a-message",
    "Send a message",
  )
  await page.selectOption("select#template-select", "E2E Template")
  //if nonsecure message click button
  if (nonSecure) {
    await page.getByRole("radio", { name: "Non-secured" }).click()
  }

  await clickButton(page, "Continue to recipients")

  await page.waitForLoadState("domcontentloaded")
  await expect(
    page.getByLabel("Search").getByRole("cell", { name: "List is empty" }),
  ).toBeHidden()

  await page
    .getByRole("tabpanel", { name: "Search" })
    .locator('input[name="email"]')
    .fill("dev")
  await page.getByRole("button", { name: "Search" }).click()
  await expect(
    page.getByLabel("Search").getByRole("cell", { name: "List is empty" }),
  ).toBeHidden()

  await expect(page.getByRole("cell", { name: "dev citizen" })).toBeVisible()
  await page
    .getByRole("row", { name: "dev citizen <devmessaging." })
    .getByTestId("govieIconButton-dark-flat-large-false")
    .click()
  await clickButton(page, "Continue to schedule")
  await sendMessageAndVerify(page)
}

export async function previewRecentMessageEmail(page: Page) {
  //log into ManyMe to view the message
  await page.goto("https://secure.manyme.com/login/")

  await page.getByRole("textbox", { name: "User" }).fill("devmessaging")
  await page.getByRole("textbox", { name: "Password" }).fill("Test1234!")
  await page.getByRole("button", { name: "Sign In." }).click()

  //find the message
  await page.getByRole("link", { name: "Messages", exact: true }).click()
  const newMessageRow = page.getByText("You have received a new").first()
  await expect(page.getByText("Gov.ie Secure Messaging").first()).toBeVisible()
  await newMessageRow.click()
  await page.getByRole("link", { name: "Preview" }).click()
}
