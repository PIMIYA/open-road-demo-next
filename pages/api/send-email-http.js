export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { testEmail } = req.body;

  if (!testEmail) {
    return res.status(400).json({ error: 'Please provide testEmail' });
  }

  try {
    console.log("=== SendGrid HTTP API Test ===");
    console.log("SENDGRID_API_KEY:", process.env.SENDGRID_API_KEY ? "Set" : "NOT SET");
    console.log("SENDGRID_FROM_EMAIL:", process.env.SENDGRID_FROM_EMAIL);

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: testEmail }],
          subject: '🧪 NFT Claim Email Test (HTTP API)'
        }],
        from: { email: process.env.SENDGRID_FROM_EMAIL },
        content: [{
          type: 'text/html',
          value: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #4caf50;">✅ 測試郵件發送成功！</h2>
              <p>這是一封通過 SendGrid HTTP API 發送的測試郵件。</p>
              <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <h3>測試信息：</h3>
                <p><strong>發送時間：</strong> ${new Date().toLocaleString("zh-TW")}</p>
                <p><strong>服務提供商：</strong> SendGrid HTTP API</p>
                <p><strong>發送者：</strong> ${process.env.SENDGRID_FROM_EMAIL}</p>
              </div>
              <p>如果你收到這封郵件，說明寄信功能已經正常工作了！</p>
            </div>
          `
        }]
      })
    });

    if (response.ok) {
      console.log("✅ HTTP API email sent successfully");
      return res.status(200).json({
        success: true,
        message: "Test email sent successfully via SendGrid HTTP API",
        status: response.status
      });
    } else {
      const errorText = await response.text();
      console.error("❌ HTTP API email failed:", response.status, errorText);
      return res.status(500).json({
        error: "SendGrid HTTP API failed",
        status: response.status,
        details: errorText
      });
    }

  } catch (error) {
    console.error('❌ HTTP API test failed:', error);
    return res.status(500).json({
      error: "HTTP API test failed",
      details: error.message,
    });
  }
}
