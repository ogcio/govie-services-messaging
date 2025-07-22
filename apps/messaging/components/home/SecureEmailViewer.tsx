"use client"
import type React from "react"
import { useEffect, useRef, useState } from "react"

export const iframeCspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' blob: data:;
  font-src 'self';
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-src 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`

export const SecureEmailViewer: React.FC<{
  emailContent: string
  width?: string
  height?: string
  sandboxPermissions?: string[]
}> = ({ emailContent, width = "100%", sandboxPermissions = [] }) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const [height, setHeight] = useState("0px")

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "IFRAME_HEIGHT") {
        setHeight(`${event.data.height}px`)
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [])

  const [htmlContent, setHtmlContent] = useState("")
  useEffect(() => {
    setHtmlContent(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-Content-Type-Options" content="nosniff">
          <meta http-equiv="Referrer-Policy" content="no-referrer">
          <meta http-equiv="Content-Security-Policy" content="${iframeCspHeader.replace(/\n/g, "")}">
          <base target="_blank">
          <script>
          function sendHeight() {
            const height = document.body.scrollHeight;
            window.parent.postMessage({ type: 'IFRAME_HEIGHT', height }, '*');
          }

          function initResizeObserver() {
            sendHeight(); 
            const resizeObserver = new ResizeObserver(() => {
              sendHeight();
            });
            resizeObserver.observe(document.body);
          }

          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', initResizeObserver);
          } else {
            initResizeObserver();
          }
          </script>
            
          <style>
            body {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
              max-width: 100%;
              overflow-x: hidden;
              white-space: pre-wrap;
              overflow-wrap: break-word;
              word-wrap: break-word;
            }
            img {
              max-width: 100%;
              height: auto;
            }
          </style>
        </head>
        <body>${emailContent}</body>
      </html>
    `)
  }, [emailContent])

  return (
    <iframe
      ref={iframeRef}
      style={{ width, height }}
      sandbox={[
        ...sandboxPermissions,
        "allow-forms",
        "allow-scripts",
        "allow-popups",
        "allow-popups-to-escape-sandbox",
      ].join(" ")}
      title='Secure email content viewer'
      referrerPolicy='no-referrer'
      srcDoc={htmlContent}
    />
  )
}
