import { expect, type Page, test } from "@playwright/test"
import { authenticateUser } from "../helpers/auth"
import { createPageWithVideo } from "../helpers/browser-context"
import { clickButton, generateTestData, searchByText } from "../utils/functions"
import { fillTemplateForm } from "../utils/template-helpers"

let authenticatedPage: Page

test.describe("Admin Message Templates", () => {
  test.beforeAll(async ({ browser }) => {
    authenticatedPage = await createPageWithVideo(browser)
    await authenticateUser(authenticatedPage)
  })

  test.afterAll(async () => {
    await authenticatedPage.close()
  })

  test("an admin can create a message template and then delete this @smoke @regression", async () => {
    const { timestamp } = generateTestData()
    const templateName = `Playwright Template name ${timestamp}`

    await authenticatedPage.goto("/en/admin/message-templates/template")
    await authenticatedPage.getByText("English").click()

    const { templateName: createdName } = await fillTemplateForm(
      authenticatedPage,
      templateName,
    )

    await expect(
      authenticatedPage.getByText(
        `Your template '${createdName}' has been successfully added would you like to test it now?`,
      ),
    ).toBeVisible()
    await expect(
      authenticatedPage.getByRole("cell", { name: createdName }),
    ).toBeVisible()
    await authenticatedPage
      .getByRole("row", { name: `${createdName} EN` })
      .locator("button")
      .last()
      .click()
    //delete the template
    await authenticatedPage
      .getByRole("button", { name: "Delete", exact: true })
      .click()

    await expect(
      authenticatedPage.getByRole("cell", { name: createdName }),
    ).not.toBeVisible()
  })

  test("Admin can search for message templates @regression", async () => {
    await authenticatedPage.goto("/en/admin/message-templates")
    //wait for table content to load
    await authenticatedPage
      .locator("table tbody tr")
      .nth(1)
      .waitFor({ state: "visible" })
    const cellContent = await authenticatedPage
      .getByRole("cell")
      .nth(3)
      .textContent()
    if (cellContent) {
      await searchByText(authenticatedPage, cellContent, "Search")
    } else {
      throw new Error("Cell content is null")
    }
    await expect(authenticatedPage.getByRole("cell").nth(3)).toContainText(
      cellContent,
    )
  })

  test("Admin can edit an existing message template @regression", async () => {
    const updatedName = `Updated name ${Date.now()}`
    await authenticatedPage.goto("/en/admin/message-templates")
    await authenticatedPage.getByRole("link", { name: "Edit" }).first().click()
    await authenticatedPage
      .getByRole("textbox", { name: "Template name" })
      .first()
      .fill(updatedName)
    await clickButton(authenticatedPage, "Update")
    await searchByText(authenticatedPage, updatedName)
    await expect(
      authenticatedPage.getByRole("cell", { name: updatedName }),
    ).toBeVisible()
  })

  test("An admin can click use this template and be taken to the send a message page @regression", async () => {
    await authenticatedPage.goto("/en/admin/message-templates")
    const templateRow = authenticatedPage
      .getByRole("row", {
        name: "Playwright Template name",
      })
      .first()
    await templateRow.getByText("Use this template").click()
    await expect(
      authenticatedPage.getByRole("heading", { name: "Send a message" }),
    ).toBeVisible()

    // Check template is already selected in combobox
    await expect(
      authenticatedPage.getByRole("combobox", { name: "Choose a template" }),
    ).toBeVisible()
    const selectedOption = await authenticatedPage
      .getByRole("option", { selected: true })
      .textContent()
    expect(selectedOption).toContain("Playwright Template name")
  })
})
