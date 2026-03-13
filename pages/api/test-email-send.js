async function sendWithResend({ to, subject, html }) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL,
      to: [to],
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${text}`);
  }
  const data = await res.json();
  return { messageId: data.id };
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
    const info = await sendWithResend({
      to: testEmail,
      subject: "NFT Claim Email Test",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Test email sent successfully</h2>
          <p>Time: ${new Date().toLocaleString("zh-TW")}</p>
          <p>From: ${process.env.RESEND_FROM_EMAIL}</p>
          <p>Method: Resend API</p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Test email sent",
      messageId: info.messageId,
      config: {
        method: "Resend API",
        from: process.env.RESEND_FROM_EMAIL,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      config: {
        method: "Resend API",
        from: process.env.RESEND_FROM_EMAIL,
      },
    });
  }
}
