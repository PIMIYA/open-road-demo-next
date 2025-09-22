import nodemailer from 'nodemailer';

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const {
    email,
    userAddress,
    tokenId,
    contractAddress,
    claimStatus,
    nftName,
    nftDescription,
    nftImageUrl,
  } = req.body;

  // 驗證必要參數
  if (!email || !userAddress) {
    return res
      .status(400)
      .json({ error: "Missing required fields: email and userAddress" });
  }

  try {
    console.log("Creating SMTP transporter...");
    console.log("SMTP_HOST:", process.env.SMTP_HOST);
    console.log("SMTP_PORT:", process.env.SMTP_PORT);
    console.log("SMTP_USER:", process.env.SMTP_USER);

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
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

    // 生成郵件內容
    const emailContent = generateEmailContent({
      userAddress,
      tokenId,
      contractAddress,
      claimStatus,
      nftName,
      nftDescription,
      nftImageUrl,
    });

    console.log("Verifying SMTP connection...");
    await transporter.verify();
    console.log("✅ SMTP connection verified successfully!");

    console.log("Sending email to:", email);
    // 發送郵件
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: email,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
    });

    console.log("✅ Email sent successfully:", info.messageId);

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      message: "Email sent successfully",
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return res.status(500).json({
      error: "Failed to send email",
      details: error.message,
      code: error.code,
    });
  }
}

function generateEmailContent({
  userAddress,
  tokenId,
  contractAddress,
  claimStatus,
  nftName,
}) {
  const getStatusMessage = () => {
    switch (claimStatus) {
      case "success":
        return "恭喜您成功領取了 NFT！";
      case "alreadyClaimed":
        return "您已經領取過這個 NFT 了！";
      default:
        return "領取處理完成！";
    }
  };

  const nftViewUrl =
    tokenId && contractAddress
      ? `${process.env.NEXT_PUBLIC_BASE_URL}/claimsToken/${contractAddress}/${tokenId}`
      : null;

  const walletViewUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/wallet/${userAddress}`;

  // 郵件標題包含 NFT 名稱
  const subject = `NFT 領取完成 - ${nftName || "您的 NFT"}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>NFT 領取完成</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f5f5f5;
        }
        .container {
          background-color: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .success-icon {
          font-size: 60px;
          color: #4caf50;
          margin-bottom: 20px;
        }
        .title {
          font-size: 28px;
          font-weight: bold;
          margin-bottom: 10px;
        }
        .subtitle {
          font-size: 18px;
          color: #666;
          margin-bottom: 30px;
        }
        .buttons {
          text-align: center;
          margin: 30px 0;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          margin: 10px;
          background-color: #1976d2;
          color: white;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
        }
        .button:hover {
          background-color: #1565c0;
        }
        .button.secondary {
          background-color: transparent;
          color: #1976d2;
          border: 2px solid #1976d2;
        }
        .button.secondary:hover {
          background-color: rgba(25, 118, 210, 0.04);
        }
        .footer {
          text-align: center;
          margin-top: 30px;
          color: #666;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="success-icon">✓</div>
          <div class="title">領取完成！</div>
          <div class="subtitle">${getStatusMessage()}</div>
        </div>

        <div class="buttons">
          ${
            nftViewUrl
              ? `<a href="${nftViewUrl}" class="button">看看 NFT</a>`
              : ""
          }
          <a href="${walletViewUrl}" class="button secondary">看看自己錢包</a>
        </div>

        <div class="footer">
          <p>感謝您使用我們的服務</p>
          <p>如有任何問題，請聯繫我們的客服團隊</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
領取完成！

${getStatusMessage()}

${nftViewUrl ? `查看 NFT: ${nftViewUrl}` : ""}
查看錢包: ${walletViewUrl}

感謝您使用我們的服務
  `;

  return { subject, html, text };
}