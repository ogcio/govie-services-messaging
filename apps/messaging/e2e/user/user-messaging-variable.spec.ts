import { expect, type Page, test } from "@playwright/test"
import { clickButton, logout } from "e2e/utils/functions"
import { sendMessageAndVerify } from "e2e/utils/message-helpers"
import { createAuthenticatedPage } from "../helpers/user-auth.helper"

let page: Page

test.describe("User Messaging page", () => {
  test.beforeAll(async ({ browser }) => {
    page = await createAuthenticatedPage(browser, "john.doe@gov.ie")
  })

  test.afterAll(async () => {
    await page.close()
  })

  test("a user can see variables in a message @smoke @regression", async () => {
    await page.selectOption(
      "select#template-select",
      "{{publicName}} {{ppsn}} {{email}}",
    )
    await clickButton(page, "Continue to recipients")

    await page.waitForLoadState("domcontentloaded")
    await expect(
      page.getByLabel("Search").getByRole("cell", { name: "List is empty" }),
    ).toBeHidden()

    await page
      .getByRole("tabpanel", { name: "Search" })
      .locator('input[name="email"]')
      .fill("michael.clarkson+4@nearform.com")
    await page.getByRole("button", { name: "Search" }).click()
    await expect(page.getByRole("row").nth(1)).toContainText(
      "michael.clarkson+4@nearform.com",
    )
    await page.getByTestId("govieIconButton-dark-flat-large-false").click()
    await clickButton(page, "Continue to schedule")
    await sendMessageAndVerify(page)

    await logout(page)
    //login as citizen to view the message
    await page.getByRole("button", { name: "Continue with MyGovId" }).click()
    await page.selectOption("select#user_select", "bruce.wayne@mail.ie")
    await page.locator("[type=password]").fill("123")
    await page.keyboard.press("Enter")

    await expect(page.getByRole("row").nth(1)).toContainText(
      "michael.clarkson+4@nearform.com",
    )
    await page
      .getByRole("link", {
        name: "mikex clarksonx michael.clarkson+4@nearform.com",
      })
      .first()
      .click()
    await expect(
      page.getByText("{{publicName}} {{ppsn}} {{email}}"),
    ).not.toBeVisible()
  })
})
