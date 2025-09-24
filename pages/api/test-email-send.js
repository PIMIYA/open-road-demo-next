import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { testEmail } = req.body;

  if (!testEmail) {
    return res.status(400).json({ error: 'Please provide testEmail' });
  }

  try {
    console.log("=== SendGrid Configuration Test ===");
    console.log(
      "SENDGRID_API_KEY:",
      process.env.SENDGRID_API_KEY ? "Set" : "NOT SET"
    );
    console.log("SENDGRID_FROM_EMAIL:", process.env.SENDGRID_FROM_EMAIL);

    const transporter = nodemailer.createTransport({
      service: "SendGrid",
      auth: {
        user: "apikey", // 這裡固定填 'apikey'
        pass: process.env.SENDGRID_API_KEY, // 這裡填 API key
      },
    });

    console.log("Verifying SendGrid connection...");
    await transporter.verify();
    console.log("✅ SendGrid connection verified successfully!");

    // 發送測試郵件
    const testEmailContent = {
      from: process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM,
      to: testEmail,
      subject: "🧪 NFT Claim Email Test",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4caf50;">✅ 測試郵件發送成功！</h2>
          <p>這是一封測試郵件，用於驗證 NFT 領取確認郵件功能。</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>測試信息：</h3>
            <p><strong>發送時間：</strong> ${new Date().toLocaleString(
              "zh-TW"
            )}</p>
            <p><strong>服務提供商：</strong> SendGrid</p>
            <p><strong>發送者：</strong> ${
              process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM
            }</p>
          </div>
          <p>如果你收到這封郵件，說明寄信功能已經正常工作了！</p>
        </div>
      `,
      text: `
        測試郵件發送成功！

        這是一封測試郵件，用於驗證 NFT 領取確認郵件功能。

        測試信息：
        - 發送時間：${new Date().toLocaleString("zh-TW")}
        - 服務提供商：SendGrid
        - 發送者：${process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM}

        如果你收到這封郵件，說明寄信功能已經正常工作了！
      `,
    };

    console.log("Sending test email to:", testEmail);
    const info = await transporter.sendMail(testEmailContent);
    console.log("✅ Test email sent successfully:", info.messageId);

    return res.status(200).json({
      success: true,
      message: "Test email sent successfully",
      messageId: info.messageId,
      config: {
        service: "SendGrid",
        from: process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM,
      },
    });

  } catch (error) {
    console.error('❌ Test email failed:', error);
    return res.status(500).json({
      error: "Test email failed",
      details: error.message,
      code: error.code,
      config: {
        service: "SendGrid",
        from: process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM,
      },
    });
  }
}

