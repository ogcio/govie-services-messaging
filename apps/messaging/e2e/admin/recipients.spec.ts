import { expect, test } from "@playwright/test"
import { clickButton } from "../utils/functions"
import { navigateAndVerifyHeading } from "../utils/navigation-helpers"
import { verifyTableContents } from "../utils/table-helpers"
import { setupTestSuite } from "../utils/test-helpers"

setupTestSuite("Admin Recipients Management", (authenticatedPage) => {
  test("an admin can search for recipients @regression", async () => {
    await navigateAndVerifyHeading(
      authenticatedPage,
      "/en/admin/send-a-message",
      "Send a message",
    )
    await clickButton(authenticatedPage, "Continue to recipients")

    await authenticatedPage
      .getByTestId("govie-stack-item-2")
      .getByTestId("govie-stack-item-0")
      .locator('input[name="firstName"]')
      .fill("test")

    await clickButton(authenticatedPage, "Search")
    await verifyTableContents(authenticatedPage, /test/, true)
  })

  test("Admin can remove a recipient from a message before it is scheduled @regression", async () => {
    await navigateAndVerifyHeading(
      authenticatedPage,
      "/en/admin/send-a-message",
      "Send a message",
    )
    await clickButton(authenticatedPage, "Continue to recipients")

    // Verify empty list and add recipient
    await expect(
      authenticatedPage.getByRole("cell", { name: "List is empty" }).last(),
    ).toBeVisible()
    await clickButton(authenticatedPage, "Add recipient")

    // Verify recipient added and then remove
    await expect(
      authenticatedPage.getByRole("cell", { name: "List is empty" }).last(),
    ).not.toBeVisible()
    await clickButton(authenticatedPage, "Remove Recipient")
    await expect(
      authenticatedPage.getByRole("cell", { name: "List is empty" }),
    ).toBeVisible()
  })
})
