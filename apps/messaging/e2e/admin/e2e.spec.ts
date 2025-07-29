import { expect, type Page, test } from "@playwright/test"
import { authenticateUser } from "../helpers/auth"
import { createPageWithVideo } from "../helpers/browser-context"
import {
  logout,
  previewRecentMessageEmail,
  sendMessageToDevCitizen,
} from "../utils/functions"

let authenticatedPage: Page

test.describe("Admin Message Sending > Citizen Viewing", () => {
  test.beforeEach(async ({ browser }) => {
    authenticatedPage = await createPageWithVideo(browser)
    //clear the cache
    await authenticatedPage.context().clearCookies()
  })

  test.afterAll(async () => {
    await authenticatedPage.close()
  })

  let href: string

  test("admin sends message to citizen and they receive email @regression", async () => {
    await authenticateUser(authenticatedPage)
    await sendMessageToDevCitizen(authenticatedPage)
    await authenticatedPage
      .getByRole("link", { name: "View Event log" })
      .click()
    await authenticatedPage.getByRole("link", { name: "View" }).first().click()

    // Verify message content details
    // Verify the current date is displayed
    const currentDate = new Date()
      .toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
      .replace(/\//g, "-")
    await expect(
      authenticatedPage.getByRole("cell", { name: currentDate }).first(),
    ).toBeVisible()

    // Verify the time is recent (matches HH:MM:SS format and is within reasonable range)
    const timePattern = /\d{2}:\d{2}:\d{2}/
    const timeCells = authenticatedPage
      .getByRole("cell")
      .filter({ hasText: timePattern })
    await expect(timeCells.first()).toBeVisible()

    await expect(authenticatedPage.getByText("failed")).not.toBeVisible()
    //logout as admin
    await logout(authenticatedPage)

    await previewRecentMessageEmail(authenticatedPage)

    //view the message
    const today = new Date().toLocaleDateString("en-US", {
      month: "long",
      day: "2-digit",
      year: "numeric",
    })
    await expect(authenticatedPage.getByText(today)).toBeVisible()

    //allow time for the iframe to load
    const iframe = await authenticatedPage.locator("iframe")
    const contentFrame = await iframe.contentFrame()
    const link = await contentFrame.getByRole("link", {
      name: "view your message",
    })
    //navigate to view your message link
    const hrefValue = await link.getAttribute("href")
    console.log("Message link:", hrefValue)
    if (!hrefValue) {
      throw new Error("Link to view message is not available")
    }
    href = hrefValue
  })

  test("citizen visits view your message link and gets taken to the message @regression", async () => {
    await authenticatedPage.goto(href)

    //login as citizen to view the message
    await authenticatedPage
      .getByRole("button", { name: "Continue with MyGovId" })
      .click()
    await authenticatedPage.selectOption(
      "select#user_select",
      "peter.parker@mail.ie",
    )
    await authenticatedPage.locator("[type=password]").fill("123")
    await authenticatedPage.keyboard.press("Enter")

    //land on message page
    await expect(
      authenticatedPage.getByRole("heading", { name: "Test subject" }),
    ).toBeVisible()
    await authenticatedPage.getByRole("link", { name: "Back" }).click()
    await logout(authenticatedPage)
  })

  test("citizen can see a non secure message in their emails @regression", async () => {
    await authenticateUser(authenticatedPage)
    await sendMessageToDevCitizen(authenticatedPage, true)
    await previewRecentMessageEmail(authenticatedPage)
    await authenticatedPage.getByRole("link", { name: "Messages" }).click()
    // Wait for the messages table to load
    await authenticatedPage.waitForTimeout(5000)
    await authenticatedPage.reload()
    await authenticatedPage
      .getByRole("link", { name: "Test subject" })
      .first()
      .click()
    await authenticatedPage.getByRole("link", { name: "Preview" }).click()
    await expect(
      authenticatedPage
        .locator("iframe")
        .contentFrame()
        .getByText("Test rich text"),
    ).toBeVisible()
  })
})
