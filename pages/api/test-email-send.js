async function sendWithSendGrid({ to, subject, html }) {
  const res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: process.env.SENDGRID_FROM_EMAIL },
      subject,
      content: [{ type: "text/html", value: html }],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`SendGrid ${res.status}: ${text}`);
  }
  return { messageId: res.headers.get("x-message-id") };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { testEmail } = req.body;

  if (!testEmail) {
    return res.status(400).json({ error: "Please provide testEmail" });
  }

  try {
    const info = await sendWithSendGrid({
      to: testEmail,
      subject: "NFT Claim Email Test",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Test email sent successfully</h2>
          <p>Time: ${new Date().toLocaleString("zh-TW")}</p>
          <p>From: ${process.env.SENDGRID_FROM_EMAIL}</p>
          <p>Method: SendGrid HTTP API</p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Test email sent",
      messageId: info.messageId,
      config: {
        method: "SendGrid HTTP API",
        from: process.env.SENDGRID_FROM_EMAIL,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      config: {
        method: "SendGrid HTTP API",
        from: process.env.SENDGRID_FROM_EMAIL,
      },
    });
  }
}
