import "dotenv/config"
import util from "node:util"
import * as chromeLauncher from "chrome-launcher"
import puppeteer from "puppeteer"
import request from "request"
import { loginSpecificUser } from "./login.mjs"
import { runA11yForURL } from "./runA11y.mjs"
import { runLighthouseForURL } from "./runLighthouse.mjs"

const environment =
  process.env.environment || "https://messaging.dev.services.gov.ie"

// Common configuration
const loginURL = environment

async function runCitizenTests() {
  console.log("=== STARTING CITIZEN TESTS ===")

  const opts = {
    output: "json",
    disableDeviceEmulation: true,
    defaultViewport: {
      width: 1200,
      height: 900,
    },
    chromeFlags: [
      "--headless",
      "--disable-mobile-emulation",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  }

  const chrome = await chromeLauncher.launch(opts)
  opts.port = chrome.port

  const resp = await util.promisify(request)(
    `http://localhost:${opts.port}/json/version`,
  )
  const { webSocketDebuggerUrl } = JSON.parse(resp.body)
  const browser = await puppeteer.connect({
    browserWSEndpoint: webSocketDebuggerUrl,
  })

  const page = (await browser.pages())[0]
  await page.setViewport({ width: 1200, height: 900 })

  try {
    const unread = `${loginURL}/en/home?tab=unread`
    const all = `${loginURL}/en/home?tab=all`
    const messageExample = `${loginURL}/en/home/05bcc336-5b19-4717-9223-16a68fc08a2e?tab=all`

    await loginSpecificUser(loginURL, "Andrew Parker", page, true)

    // Run A11y.
    await runA11yForURL(browser, unread, opts, "unread-messages")
    await runA11yForURL(browser, all, opts, "all-messages")
    await runA11yForURL(browser, messageExample, opts, "example-message")

    // Run Lighthouse tests sequentially to avoid conflicts
    await runLighthouseForURL(browser, unread, opts, "unread-messages")
    await runLighthouseForURL(browser, all, opts, "all-messages")
    await runLighthouseForURL(browser, messageExample, opts, "messageExample")

    console.log("=== CITIZEN TESTS COMPLETED ===")
  } finally {
    await browser.disconnect()
    await chrome.kill()
  }
}

async function runAdminTests() {
  console.log("=== STARTING ADMIN TESTS ===")

  const opts = {
    output: "json",
    disableDeviceEmulation: true,
    defaultViewport: {
      width: 1200,
      height: 900,
    },
    chromeFlags: [
      "--headless",
      "--disable-mobile-emulation",
      "--no-sandbox",
      "--disable-setuid-sandbox",
    ],
  }

  const chrome = await chromeLauncher.launch(opts)
  opts.port = chrome.port

  const resp = await util.promisify(request)(
    `http://localhost:${opts.port}/json/version`,
  )
  const { webSocketDebuggerUrl } = JSON.parse(resp.body)
  const browser = await puppeteer.connect({
    browserWSEndpoint: webSocketDebuggerUrl,
  })

  const page = (await browser.pages())[0]
  await page.setViewport({ width: 1200, height: 900 })

  try {
    const adminSend = `${loginURL}/en/admin/send-a-message`
    const adminTemplates = `${loginURL}/en/admin/message-templates`
    const adminNewTemplate = `${loginURL}/en/admin/message-templates/template`
    const adminProviders = `${loginURL}/en/admin/providers`
    const adminNewProvider = `${loginURL}/en/admin/providers/email`
    const adminMessageEvents = `${loginURL}/en/admin/message-events`
    const adminEventExample = `${loginURL}/en/admin/message-events/4f765021-4760-4d1c-8f3e-c620c5cc407e`

    await loginSpecificUser(
      loginURL,
      "Edward Stark (public servant)",
      page,
      true,
    )

    // Run A11y.
    await runA11yForURL(browser, adminSend, opts, "admin-send-a-message")
    await runA11yForURL(browser, adminTemplates, opts, "admin-templates")
    await runA11yForURL(browser, adminNewTemplate, opts, "admin-new-template")
    await runA11yForURL(browser, adminProviders, opts, "admin-providers")
    await runA11yForURL(browser, adminNewProvider, opts, "admin-new-provider")
    await runA11yForURL(
      browser,
      adminMessageEvents,
      opts,
      "admin-message-events",
    )
    await runA11yForURL(
      browser,
      adminEventExample,
      opts,
      "admin-message-event-example",
    )

    // Run Lighthouse tests sequentially to avoid conflicts
    await runLighthouseForURL(browser, adminSend, opts, "admin-send-a-message")
    await runLighthouseForURL(browser, adminTemplates, opts, "admin-templates")
    await runLighthouseForURL(
      browser,
      adminNewTemplate,
      opts,
      "admin-new-template",
    )
    await runLighthouseForURL(browser, adminProviders, opts, "admin-providers")
    await runLighthouseForURL(
      browser,
      adminNewProvider,
      opts,
      "admin-new-provider",
    )
    await runLighthouseForURL(
      browser,
      adminMessageEvents,
      opts,
      "admin-message-events",
    )
    await runLighthouseForURL(
      browser,
      adminEventExample,
      opts,
      "admin-message-event-example",
    )

    console.log("=== ADMIN TESTS COMPLETED ===")
  } finally {
    await browser.disconnect()
    await chrome.kill()
  }
}

async function main() {
  try {
    // Run citizen tests with fresh browser
    await runCitizenTests()

    // Run admin tests with fresh browser
    await runAdminTests()

    console.log("=== ALL TESTS COMPLETED SUCCESSFULLY ===")
  } catch (error) {
    console.error("Test execution failed:", error)
    process.exit(1)
  }
}

await main()
