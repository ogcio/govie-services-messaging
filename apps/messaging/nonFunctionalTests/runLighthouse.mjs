import fs from "node:fs"
import lighthouse from "lighthouse"
import config from "lighthouse/core/config/lr-desktop-config.js"
import { ReportGenerator } from "lighthouse/report/generator/report-generator.js"

export async function runLighthouseForURL(
  browser,
  pageURL,
  opts,
  reportNameForFile,
) {
  const scores = {
    Performance: 0,
    Accessibility: 0,
    "Best Practices": 0,
    SEO: 0,
  }

  // Extract the port from the browser's WebSocket endpoint
  const wsEndpoint = browser.wsEndpoint()
  const port = wsEndpoint.split(":")[2].split("/")[0]

  console.log(`Running Lighthouse for ${pageURL} on port ${port}`)

  // Use the existing browser instance by specifying the port
  const report = await lighthouse(
    pageURL,
    { ...opts, port: parseInt(port) },
    config,
  )
    .then((results) => {
      return results
    })
    .catch((error) => {
      console.error(`Lighthouse failed for ${pageURL}:`, error)
      throw error
    })
  const html = ReportGenerator.generateReport(report.lhr, "html")
  const json = ReportGenerator.generateReport(report.lhr, "json")
  scores.Performance = JSON.parse(json).categories.performance.score
  scores.Accessibility = JSON.parse(json).categories.accessibility.score
  scores["Best Practices"] = JSON.parse(json).categories["best-practices"].score
  scores.SEO = JSON.parse(json).categories.seo.score

  // biome-ignore lint/correctness/noUnusedVariables: legacy
  const baselineScores = {
    Performance: 0.9,
    Accessibility: 0.9,
    "Best Practices": 0.9,
    SEO: 0.9,
  }

  // Ensure the directory exists
  const perfDir = `test_reports/perf`
  if (!fs.existsSync(perfDir)) {
    fs.mkdirSync(perfDir, { recursive: true })
  }

  fs.writeFile(
    `${perfDir}/${reportNameForFile}-lighthouse.html`,
    html,
    (err) => {
      if (err) {
        console.error("Error writing HTML report:", err)
      }
    },
  )

  fs.writeFile(
    `${perfDir}/${reportNameForFile}-lighthouse.json`,
    json,
    (err) => {
      if (err) {
        console.error("Error writing JSON report:", err)
      }
    },
  )
}
