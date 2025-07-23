import { expect, type Page, test } from "@playwright/test"
import { authenticateUser } from "../helpers/auth"
import { createPageWithVideo } from "../helpers/browser-context"
import { clickButton, sendE2ETemplateMessage } from "../utils/functions"
import { scheduleMessage, sendMessageAndVerify } from "../utils/message-helpers"
import { addNewRecipient } from "../utils/recipient-helpers"

let authenticatedPage: Page

test.describe("Admin Message Sending", () => {
  test.beforeAll(async ({ browser }) => {
    authenticatedPage = await createPageWithVideo(browser)
    await authenticateUser(authenticatedPage)
  })

  test.afterAll(async () => {
    await authenticatedPage.close()
  })

  test("an admin can send a secure message using send now to two recipients @regression", async () => {
    await sendE2ETemplateMessage(authenticatedPage)

    await addNewRecipient(authenticatedPage)
    //add second recipient
    await addNewRecipient(authenticatedPage)

    await clickButton(authenticatedPage, "Continue to schedule")
    await sendMessageAndVerify(authenticatedPage)
  })

  test("an admin can send a secure message using send now to a new recipient @regression", async () => {
    await sendE2ETemplateMessage(authenticatedPage)

    const { recipientEmail } = await addNewRecipient(authenticatedPage)
    await expect(
      authenticatedPage.getByRole("cell", { name: recipientEmail }),
    ).toBeVisible()

    await clickButton(authenticatedPage, "Continue to schedule")
    await sendMessageAndVerify(authenticatedPage)
  })

  test("an admin can send a non secure message using send now @regression", async () => {
    await sendE2ETemplateMessage(authenticatedPage, true)

    const { recipientEmail } = await addNewRecipient(authenticatedPage)
    await expect(
      authenticatedPage.getByRole("cell", { name: recipientEmail }),
    ).toBeVisible()

    await clickButton(authenticatedPage, "Continue to schedule")
    await sendMessageAndVerify(authenticatedPage)
  })

  test("an admin can send a secure message using schedule @regression", async () => {
    await sendE2ETemplateMessage(authenticatedPage)
    await addNewRecipient(authenticatedPage)
    await clickButton(authenticatedPage, "Continue to schedule")
    await scheduleMessage(authenticatedPage)
  })

  test("an admin can send a non secure message using schedule @regression", async () => {
    await sendE2ETemplateMessage(authenticatedPage, true)
    await addNewRecipient(authenticatedPage)
    await clickButton(authenticatedPage, "Continue to schedule")
    await scheduleMessage(authenticatedPage)
  })

  test("an admin can send a non secure message to two recipients using schedule @regression", async () => {
    await sendE2ETemplateMessage(authenticatedPage, true)
    await addNewRecipient(authenticatedPage)
    await addNewRecipient(authenticatedPage)
    await clickButton(authenticatedPage, "Continue to schedule")
    await scheduleMessage(authenticatedPage)
  })

  test("clicking send another message takes you back to the first page @regression", async () => {
    await sendE2ETemplateMessage(authenticatedPage)
    await authenticatedPage
      .getByTestId("govieIconButton-dark-flat-large-false")
      .first()
      .click()
    await clickButton(authenticatedPage, "Continue to schedule")
    await sendMessageAndVerify(authenticatedPage)
    await authenticatedPage
      .getByRole("button", { name: "Send another message" })
      .click()
    await expect(authenticatedPage.url()).toContain("/en/admin/send-a-message")
    await expect(
      authenticatedPage.getByRole("heading", { name: "Send a message" }),
    ).toBeVisible()
  })
})
