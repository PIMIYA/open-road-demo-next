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
  console.log("=========tokenId is : ", tokenId);
  // 驗證必要參數
  if (!email || !userAddress) {
    return res
      .status(400)
      .json({ error: "Missing required fields: email and userAddress" });
  }

  // 立即返回成功響應，不等待寄信完成
  res.status(200).json({
    tokenId,
    contractAddress,
    success: true,
    message: "Email queued for background processing via HTTP API",
  });

  // 在背景處理寄信（不阻塞響應）
  processEmailInBackground({
    email,
    userAddress,
    tokenId,
    contractAddress,
    claimStatus,
    nftName,
    nftDescription,
    nftImageUrl,
  }).catch((error) => {
    console.error("Background email processing failed:", error);
  });
}

async function processEmailInBackground({
  email,
  userAddress,
  tokenId,
  contractAddress,
  claimStatus,
  nftName,
  nftDescription,
  nftImageUrl,
}) {
  try {
    console.log("🔄 Processing email in background via HTTP API for:", email);

    // 生成郵件內容
    const emailContent = generateEmailContent({
      email,
      userAddress,
      tokenId,
      contractAddress,
      claimStatus,
      nftName,
      nftDescription,
      nftImageUrl,
    });

    const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: [{ email: email }],
            subject: emailContent.subject,
          },
        ],
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || process.env.SMTP_FROM,
        },
        content: [
          {
            type: "text/plain",
            value: emailContent.text,
          },
          {
            type: "text/html",
            value: emailContent.html,
          },
        ],
      }),
    });

    if (response.ok) {
      console.log("✅ Background email sent successfully via HTTP API");
    } else {
      const errorText = await response.text();
      console.error(
        "❌ Background email failed via HTTP API:",
        response.status,
        errorText
      );
    }
  } catch (error) {
    console.error("❌ Background email failed:", error);
  }
}

function generateEmailContent({
  userAddress,
  tokenId,
  contractAddress,
  claimStatus,
  nftName,
  nftDescription,
}) {
  const getStatusMessage = () => {
    switch (claimStatus) {
      case "success":
        return "恭喜您成功領取了 NFT！";
      case "alreadyClaimed":
        return "您已經領取過這個 NFT 了！";
      case "soldOut":
        return "抱歉，這個 NFT 已經售罄了！";
      case "invalid":
        return "領取失敗：無效的地址或池子！";
      case "error":
        return "領取過程中發生錯誤！";
      default:
        return "領取處理完成！";
    }
  };

  const getButtonText = () => {
    switch (claimStatus) {
      case "success":
        return "看看 NFT";
      case "alreadyClaimed":
        return "查看我的 NFT";
      default:
        return "看看 NFT";
    }
  };

  console.log("🔍 Debug button display:");
  console.log("  - tokenId:", tokenId, "(type:", typeof tokenId, ")");
  console.log(
    "  - contractAddress:",
    contractAddress,
    "(type:",
    typeof contractAddress,
    ")"
  );
  console.log("  - SERVER_URL:", process.env.SERVER_URL);

  const baseUrl = process.env.SERVER_URL || "http://localhost:3000";

  const nftViewUrl =
    tokenId && contractAddress && tokenId !== "" && contractAddress !== ""
      ? `${baseUrl}/claimsToken/${contractAddress}/${tokenId}`
      : null;

  console.log("  - nftViewUrl:", nftViewUrl);
  console.log(
    "  - Button will show:",
    !!(tokenId && contractAddress && tokenId !== "" && contractAddress !== "")
  );

  const walletViewUrl = `${baseUrl}/wallet/${userAddress}`;

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
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          line-height: 1.6;
          color: #333;
          margin: 0;
          padding: 0;
          background-color: #f5f5f5;
        }
        .email-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .main-container {
          max-width: 600px;
          width: 100%;
          background-color: white;
          border-radius: 8px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }
        .content-wrapper {
          padding: 32px;
        }
        .header {
          text-align: center;
          margin-bottom: 32px;
        }
        .success-icon {
          font-size: 80px;
          color: #4caf50;
          margin-bottom: 16px;
          display: block;
        }
        .title {
          font-size: 48px;
          font-weight: 400;
          margin-bottom: 8px;
          color: #333;
        }
        .subtitle {
          font-size: 20px;
          color: rgba(0, 0, 0, 0.6);
          margin-bottom: 32px;
        }
        .email-status {
          color: #4caf50;
          font-size: 14px;
          margin-top: 8px;
        }
        .nft-info {
          background-color: #f9f9f9;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .nft-image {
          max-width: 100%;
          height: auto;
          border-radius: 8px;
          margin-bottom: 15px;
        }
        .nft-name {
          font-size: 20px;
          font-weight: 500;
          margin-bottom: 10px;
          color: #333;
        }
        .nft-description {
          color: rgba(0, 0, 0, 0.6);
          margin-bottom: 15px;
        }
        .button-container {
          text-align: center;
          margin: 32px 0;
        }
        .button-stack {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 20px;
        }
        .button {
          display: inline-block;
          padding: 16px 32px;
          background-color: #1976d2;
          color: white;
          text-decoration: none;
          border-radius: 20px;
          font-weight: 500;
          font-size: 18px;
          min-width: 200px;
          text-align: center;
          border: none;
          cursor: pointer;
          transition: background-color 0.2s;
        }
        .button:hover {
          background-color: #1565c0;
          text-decoration: none;
          color: white;
        }
        .button.secondary {
          background-color: transparent;
          color: #1976d2;
          border: 2px solid #1976d2;
        }
        .button.secondary:hover {
          background-color: rgba(25, 118, 210, 0.04);
          color: #1976d2;
        }
        .button:disabled {
          background-color: #ccc;
          color: #666;
          cursor: not-allowed;
        }
        .button.secondary:disabled {
          background-color: transparent;
          color: #ccc;
          border-color: #ccc;
        }
        .info-section {
          background-color: #f0f8ff;
          padding: 20px;
          border-radius: 8px;
          margin: 20px 0;
        }
        .info-section h3 {
          margin: 0 0 16px 0;
          font-size: 18px;
          font-weight: 500;
          color: #333;
        }
        .info-item {
          margin: 8px 0;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.5;
        }
        .debug-info {
          background-color: white;
          padding: 20px;
          margin: 20px 0;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
        }
        .debug-info h3 {
          font-size: 18px;
          font-weight: 500;
          margin: 0 0 16px 0;
          color: #333;
        }
        .debug-content {
          text-align: left;
          font-family: 'SF Mono', Monaco, 'Cascadia Code', 'Roboto Mono', Consolas, 'Courier New', monospace;
          font-size: 14px;
          line-height: 1.6;
        }
        .footer {
          text-align: center;
          margin-top: 32px;
          color: rgba(0, 0, 0, 0.6);
          font-size: 14px;
        }
        .footer p {
          margin: 8px 0;
        }
        @media (max-width: 600px) {
          .content-wrapper {
            padding: 20px;
          }
          .title {
            font-size: 36px;
          }
          .subtitle {
            font-size: 18px;
          }
          .button {
            min-width: 180px;
            font-size: 16px;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-container">
        <div class="main-container">
          <div class="content-wrapper">
            <div class="header">
              <div class="success-icon">✓</div>
              <div class="title">領取完成！</div>
              <div class="subtitle">${getStatusMessage()}</div>
              ${
                claimStatus === "success"
                  ? `<div class="email-status">📧 確認郵件已發送到您的信箱</div>`
                  : ""
              }
            </div>

            <div class="button-container">
              <div class="button-stack">
                ${
                  tokenId &&
                  contractAddress &&
                  tokenId !== "" &&
                  contractAddress !== ""
                    ? `<a href="${nftViewUrl}" class="button">${getButtonText()}</a>`
                    : ""
                }
                <a href="${walletViewUrl}" class="button secondary">看看自己錢包</a>
              </div>
            </div>

            <div class="footer">
              <p>感謝您使用我們的服務</p>
              <p>如有任何問題，請聯繫我們的客服團隊</p>
            </div>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
    領取完成！

    ${getStatusMessage()}

    ${nftName ? `NFT 名稱: ${nftName}` : ""}
    ${nftDescription ? `描述: ${nftDescription}` : ""}

    錢包地址: ${userAddress}
    ${tokenId ? `Token ID: ${tokenId}` : ""}
    ${contractAddress ? `合約地址: ${contractAddress}` : ""}
    領取狀態: ${claimStatus || "未獲取"}

    ${nftViewUrl ? `查看 NFT: ${nftViewUrl}` : ""}
    查看錢包: ${walletViewUrl}

    感謝您使用我們的服務
  `;

  return { subject, html, text };
}
