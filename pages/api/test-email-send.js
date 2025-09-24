export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { testEmail } = req.body;

  if (!testEmail) {
    return res.status(400).json({ error: "Please provide testEmail" });
  }

  // 立即返回成功響應，不等待寄信完成
  res.status(200).json({
    success: true,
    message: "Test email queued for background processing via HTTP API",
  });

  // 在背景處理寄信（不阻塞響應）
  processTestEmailInBackground(testEmail).catch((error) => {
    console.error("Background test email processing failed:", error);
  });
}

async function processTestEmailInBackground(testEmail) {
  try {
    console.log(
      "🔄 Processing test email in background via HTTP API for:",
      testEmail
    );
    console.log("=== SendGrid HTTP API Test ===");
    console.log(
      "SENDGRID_API_KEY:",
      process.env.SENDGRID_API_KEY ? "Set" : "NOT SET"
    );
    console.log("SENDGRID_FROM_EMAIL:", process.env.SENDGRID_FROM_EMAIL);

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: testEmail }],
            subject: "🧪 NFT Claim Email Test (HTTP API)",
          },
        ],
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM,
        },
        content: [
          {
            type: "text/html",
            value: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #4caf50;">✅ 測試郵件發送成功！</h2>
              <p>這是一封通過 SendGrid HTTP API 發送的測試郵件。</p>
              <div style="padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>測試信息：</h3>
                <p><strong>發送時間：</strong> ${new Date().toLocaleString(
                  "zh-TW"
                )}</p>
                <p><strong>服務提供商：</strong> SendGrid HTTP API</p>
                <p><strong>發送者：</strong> ${
                  process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM
                }</p>
                <p><strong>發送方式：</strong> 背景處理</p>
              </div>
              <p>如果你收到這封郵件，說明寄信功能已經正常工作了！</p>
            </div>
          `,
          },
        ],
      }),
    });

    if (response.ok) {
      console.log("✅ Background test email sent successfully via HTTP API");
    } else {
      const errorText = await response.text();
      console.error(
        "❌ Background test email failed via HTTP API:",
        response.status,
        errorText
      );
    }
  } catch (error) {
    console.error("❌ Background test email failed:", error);
  }
}
