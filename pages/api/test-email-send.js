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
    console.log('=== SMTP Configuration Test ===');
    console.log('SMTP_HOST:', process.env.SMTP_HOST);
    console.log('SMTP_PORT:', process.env.SMTP_PORT);
    console.log('SMTP_SECURE:', process.env.SMTP_SECURE);
    console.log('SMTP_USER:', process.env.SMTP_USER);
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? '***' : 'NOT SET');
    console.log('SMTP_FROM:', process.env.SMTP_FROM);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: {
        rejectUnauthorized: false,
      },
    });

    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection verified successfully!');

    // 發送測試郵件
    const testEmailContent = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: testEmail,
      subject: '🧪 NFT Claim Email Test',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4caf50;">✅ 測試郵件發送成功！</h2>
          <p>這是一封測試郵件，用於驗證 NFT 領取確認郵件功能。</p>
          <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3>測試信息：</h3>
            <p><strong>發送時間：</strong> ${new Date().toLocaleString('zh-TW')}</p>
            <p><strong>SMTP 主機：</strong> ${process.env.SMTP_HOST}</p>
            <p><strong>SMTP 端口：</strong> ${process.env.SMTP_PORT}</p>
            <p><strong>發送者：</strong> ${process.env.SMTP_USER}</p>
          </div>
          <p>如果你收到這封郵件，說明寄信功能已經正常工作了！</p>
        </div>
      `,
      text: `
        測試郵件發送成功！

        這是一封測試郵件，用於驗證 NFT 領取確認郵件功能。

        測試信息：
        - 發送時間：${new Date().toLocaleString('zh-TW')}
        - SMTP 主機：${process.env.SMTP_HOST}
        - SMTP 端口：${process.env.SMTP_PORT}
        - 發送者：${process.env.SMTP_USER}

        如果你收到這封郵件，說明寄信功能已經正常工作了！
      `
    };

    console.log('Sending test email to:', testEmail);
    const info = await transporter.sendMail(testEmailContent);
    console.log('✅ Test email sent successfully:', info.messageId);

    return res.status(200).json({
      success: true,
      message: 'Test email sent successfully',
      messageId: info.messageId,
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        user: process.env.SMTP_USER,
        from: process.env.SMTP_FROM,
      }
    });

  } catch (error) {
    console.error('❌ Test email failed:', error);
    return res.status(500).json({
      error: 'Test email failed',
      details: error.message,
      code: error.code,
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: process.env.SMTP_SECURE,
        user: process.env.SMTP_USER,
        from: process.env.SMTP_FROM,
      }
    });
  }
}

