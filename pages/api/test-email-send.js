import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { testEmail } = req.body;

  if (!testEmail) {
    return res.status(400).json({ error: "Please provide testEmail" });
  }

  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: testEmail,
      subject: "NFT Claim Email Test",
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2>Test email sent successfully</h2>
          <p>Time: ${new Date().toLocaleString("zh-TW")}</p>
          <p>From: ${process.env.SMTP_FROM}</p>
          <p>Method: Gmail SMTP (nodemailer)</p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Test email sent",
      messageId: info.messageId,
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        from: process.env.SMTP_FROM,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message,
      config: {
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        from: process.env.SMTP_FROM,
      },
    });
  }
}
