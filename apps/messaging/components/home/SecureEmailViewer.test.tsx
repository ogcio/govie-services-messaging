import { render, screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"
import { iframeCspHeader, SecureEmailViewer } from "./SecureEmailViewer"

describe("SecureEmailViewer", () => {
  const mockEmailContent = "<p>Test email content</p>"

  it("renders an iframe with correct attributes", () => {
    render(<SecureEmailViewer emailContent={mockEmailContent} />)

    const iframe = screen.getByTitle("Secure email content viewer")
    expect(iframe).toBeInTheDocument()
    expect(iframe.tagName).toBe("IFRAME")

    expect(iframe).toHaveStyle({ width: "100%", height: "500px" })
    expect(iframe).toHaveAttribute("loading", "lazy")
    expect(iframe).toHaveAttribute("referrerPolicy", "no-referrer")
  })

  it("applies custom dimensions", () => {
    render(
      <SecureEmailViewer
        emailContent={mockEmailContent}
        width='800px'
        height='600px'
      />,
    )

    const iframe = screen.getByTitle("Secure email content viewer")
    expect(iframe).toHaveStyle({ width: "800px", height: "600px" })
  })

  it("includes correct sandbox permissions", () => {
    render(<SecureEmailViewer emailContent={mockEmailContent} />)

    const iframe = screen.getByTitle("Secure email content viewer")
    const sandboxAttr = iframe.getAttribute("sandbox")

    expect(sandboxAttr).toContain("allow-forms")
    expect(sandboxAttr).toContain("allow-scripts")
    expect(sandboxAttr).toContain("allow-popups")
    expect(sandboxAttr).toContain("allow-popups-to-escape-sandbox")
  })

  it("allows additional sandbox permissions", () => {
    render(
      <SecureEmailViewer
        emailContent={mockEmailContent}
        sandboxPermissions={["allow-downloads"]}
      />,
    )

    const iframe = screen.getByTitle("Secure email content viewer")
    expect(iframe.getAttribute("sandbox")).toContain("allow-downloads")
  })

  it("includes security headers in srcDoc content", () => {
    render(<SecureEmailViewer emailContent={mockEmailContent} />)

    const iframe = screen.getByTitle("Secure email content viewer")
    const srcDoc = iframe.getAttribute("srcDoc") || ""

    // Check for security headers
    expect(srcDoc).toContain('<meta http-equiv="Content-Security-Policy"')
    expect(srcDoc).toContain('<meta http-equiv="X-Content-Type-Options"')
    expect(srcDoc).toContain('<meta http-equiv="Referrer-Policy"')

    // Check CSP header content
    expect(srcDoc).toContain(iframeCspHeader.replace(/\n/g, ""))
  })

  it("renders email content in srcDoc", () => {
    const testContent = "<p>Hello, World!</p>"
    render(<SecureEmailViewer emailContent={testContent} />)

    const iframe = screen.getByTitle("Secure email content viewer")
    const srcDoc = iframe.getAttribute("srcDoc") || ""

    expect(srcDoc).toContain(testContent)
  })

  it("includes necessary style rules", () => {
    render(<SecureEmailViewer emailContent={mockEmailContent} />)

    const iframe = screen.getByTitle("Secure email content viewer")
    const srcDoc = iframe.getAttribute("srcDoc") || ""

    expect(srcDoc).toContain("max-width: 100%")
    expect(srcDoc).toContain("overflow-x: hidden")
    expect(srcDoc).toContain("img {")
    expect(srcDoc).toContain("max-width: 100%")
  })

  describe("security", () => {
    it("enforces strict CSP headers", () => {
      render(<SecureEmailViewer emailContent='<p>test</p>' />)

      const iframe = screen.getByTitle("Secure email content viewer")
      const srcDoc = iframe.getAttribute("srcDoc") || ""

      expect(srcDoc).toContain("script-src 'self'")
      expect(srcDoc).toContain("object-src 'none'")
      expect(srcDoc).toContain("base-uri 'self'")
    })

    it("allows scripts but prevents access to parent window", () => {
      const scriptContent = `
        <script>
          window.parent.document // should be blocked
          window.top // should be blocked
        </script>
      `
      render(<SecureEmailViewer emailContent={scriptContent} />)

      const iframe = screen.getByTitle("Secure email content viewer")
      const sandbox = iframe.getAttribute("sandbox") || ""
      const srcDoc = iframe.getAttribute("srcDoc") || ""

      // Should allow scripts
      expect(sandbox.split(" ")).toContain("allow-scripts")

      // But should not allow parent window access
      expect(sandbox.split(" ")).not.toContain("allow-same-origin")
      expect(sandbox.split(" ")).not.toContain("allow-top-navigation")
      expect(srcDoc).toContain("frame-ancestors 'none'")
    })
  })
})
