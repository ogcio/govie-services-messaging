import fs from "node:fs"
import lighthouse from "lighthouse"
import config from "lighthouse/core/config/lr-desktop-config.js"
import { ReportGenerator } from "lighthouse/report/generator/report-generator.js"

export async function runLighthouseForURL(pageURL, opts, reportNameForFile) {
  const scores = {
    Performance: 0,
    Accessibility: 0,
    "Best Practices": 0,
    SEO: 0,
  }

  const report = await lighthouse(pageURL, opts, config).then((results) => {
    return results
  })
  const html = ReportGenerator.generateReport(report.lhr, "html")
  const json = ReportGenerator.generateReport(report.lhr, "json")
  scores.Performance = JSON.parse(json).categories.performance.score
  scores.Accessibility = JSON.parse(json).categories.accessibility.score
  scores["Best Practices"] = JSON.parse(json).categories["best-practices"].score
  scores.SEO = JSON.parse(json).categories.seo.score

  const baselineScores = {
    Performance: 0.9,
    Accessibility: 0.9,
    "Best Practices": 0.9,
    SEO: 0.9,
  }

  fs.writeFile(
    `test_reports/perf/${reportNameForFile}-lighthouse.html`,
    html,
    (err) => {
      if (err) {
      }
    },
  )

  fs.writeFile(
    `test_reports/perf/${reportNameForFile}-lighthouse.json`,
    json,
    (err) => {
      if (err) {
      }
    },
  )
}
