export async function loginRandomcitizen(loginURL, page, useMyGovId) {
  await page.goto(loginURL, { waitUntil: "networkidle0" })

  // Login via MygovId

  if (useMyGovId) {
    // Select MyGovID

    await page.evaluate(() => {
      const buttons = document.querySelectorAll("button")
      for (const button of buttons) {
        if (button.innerText.includes("Continue with MyGovId")) {
          button.click()
          break
        }
      }
    })

    await page.waitForNavigation({
      waitUntil: "networkidle0",
      timeout: 60000,
    })

    await page.type("#login-form > div > div:nth-child(9) > input", "123")
    await page.evaluate(() => {
      document.querySelector("#submit_btn").click()
    })

    await page.waitForNavigation({
      waitUntil: "networkidle0",
      timeout: 60000,
    })
  } else {
    // Select EntraID

    await page.evaluate(() => {
      document
        .querySelector(
          "#app > div > div > main > div.vJ4aC_wrapper > div._8edF5_socialLinkList.MuJK2_main > button:nth-child(2) > div",
        )
        .click()
    })

    await page.waitForNavigation({
      waitUntil: "networkidle0",
      timeout: 60000,
    })

    //TODO sort out EntraID login
  }
}

export async function loginSpecificUser(loginURL, user, page, useMyGovId) {
  await page.goto(loginURL, { waitUntil: "networkidle0" })

  // Login via MygovId

  if (useMyGovId) {
    // Select MyGovID

    await page.evaluate(() => {
      const buttons = document.querySelectorAll("button")
      for (const button of buttons) {
        if (button.innerText.includes("Continue with MyGovId")) {
          button.click()
          break
        }
      }
    })

    await page.waitForNavigation({
      waitUntil: "networkidle0",
      timeout: 60000,
    })

    await page.type("#user_select", user)
    await page.type("#login-form > div > div:nth-child(9) > input", "123")
    await page.evaluate(() => {
      document.querySelector("#submit_btn").click()
    })

    await page.waitForNavigation({
      waitUntil: "networkidle0",
      timeout: 60000,
    })
  } else {
    // Select EntraID

    await page.evaluate(() => {
      document
        .querySelector(
          "#app > div > div > main > div.vJ4aC_wrapper > div._8edF5_socialLinkList.MuJK2_main > button:nth-child(2) > div",
        )
        .click()
    })

    await page.waitForNavigation({
      waitUntil: "networkidle0",
      timeout: 60000,
    })

    //TODO sort out EntraID login
  }
}
