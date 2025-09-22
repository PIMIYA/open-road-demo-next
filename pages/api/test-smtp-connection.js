import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("Testing SMTP connection...");
    console.log("SMTP_HOST:", process.env.SMTP_HOST);
    console.log("SMTP_PORT:", process.env.SMTP_PORT);
    console.log("SMTP_USER:", process.env.SMTP_USER);
    console.log("SMTP_SECURE:", process.env.SMTP_SECURE);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
      // 增加超時設置
      connectionTimeout: 30000, // 30 seconds
      greetingTimeout: 15000,   // 15 seconds
      socketTimeout: 30000,     // 30 seconds
      // 添加 TLS 選項
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3',
      },
    });

    console.log("Verifying SMTP connection...");
    const verifyResult = await transporter.verify();
    console.log("SMTP connection verified:", verifyResult);

    // 測試發送簡單郵件
    const testEmail = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: process.env.SMTP_USER, // 發送給自己
      subject: "SMTP Connection Test",
      text: "This is a test email to verify SMTP connection.",
      html: "<p>This is a test email to verify SMTP connection.</p>",
    };

    console.log("Sending test email...");
    const info = await transporter.sendMail(testEmail);
    console.log("Test email sent successfully:", info.messageId);

    return res.status(200).json({
      success: true,
      message: "SMTP connection test successful",
      messageId: info.messageId,
      verifyResult: verifyResult,
    });

  } catch (error) {
    console.error("SMTP connection test failed:", error);
    return res.status(500).json({
      error: "SMTP connection test failed",
      details: error.message,
      code: error.code,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    });
  }
}
