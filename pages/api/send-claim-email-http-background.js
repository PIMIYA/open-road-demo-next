async function sendWithSendGrid({ to, subject, html, text }) {
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
      content: [
        { type: "text/plain", value: text },
        { type: "text/html", value: html },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`SendGrid ${res.status}: ${body}`);
  }
}

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

  if (!email || !userAddress) {
    return res
      .status(400)
      .json({ error: "Missing required fields: email and userAddress" });
  }

  // Respond immediately, send email in background
  res.status(200).json({
    tokenId,
    contractAddress,
    success: true,
    message: "Email queued for background processing",
  });

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
  const { subject, html, text } = generateEmailContent({
    userAddress,
    tokenId,
    contractAddress,
    claimStatus,
    nftName,
    nftDescription,
    nftImageUrl,
  });

  try {
    await sendWithSendGrid({ to: email, subject, html, text });
    console.log("Background claim email sent to:", email);
  } catch (error) {
    console.error("Background claim email failed:", error.message);
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
        return "NFT CLAIMED SUCCESSFULLY";
      case "alreadyClaimed":
        return "ALREADY CLAIMED";
      case "soldOut":
        return "SOLD OUT";
      case "invalid":
        return "CLAIM FAILED: INVALID ADDRESS OR POOL";
      case "error":
        return "AN ERROR OCCURRED";
      default:
        return "CLAIM COMPLETED";
    }
  };

  const getButtonText = () => {
    switch (claimStatus) {
      case "success":
        return "VIEW NFT";
      case "alreadyClaimed":
        return "VIEW MY NFT";
      default:
        return "VIEW NFT";
    }
  };

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const nftViewUrl =
    tokenId && contractAddress && tokenId !== "" && contractAddress !== ""
      ? `${baseUrl}/claimsToken/${contractAddress}/${tokenId}`
      : null;

  const walletViewUrl = `${baseUrl}/wallet/${userAddress}`;

  const subject = `NFT Claim - ${nftName || "Your NFT"}`;

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background-color:#f5f5f5;font-family:ui-sans-serif,system-ui,sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
        <tr><td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;">
            <tr><td style="padding:40px 32px;text-align:center;">

              <!-- Check icon (HTML/CSS for email client compatibility) -->
              <div style="margin:0 auto 24px;width:64px;height:64px;border:1px solid #25e56b;text-align:center;line-height:58px;">
                <span style="font-size:32px;color:#25e56b;font-weight:300;">&#10003;</span>
              </div>

              <!-- Status -->
              <h1 style="font-size:18px;font-weight:400;text-transform:uppercase;letter-spacing:0.05em;margin:0 0 8px;">
                ${getStatusMessage()}
              </h1>

              <hr style="border:none;border-top:1px solid #2483ff33;margin:24px 0;" />

              ${nftName ? `<p style="font-size:14px;color:#2483ff;margin:0 0 24px;font-weight:300;">${nftName}</p>` : ""}
              ${nftDescription ? `<p style="font-size:13px;color:#2483ff99;margin:0 0 24px;font-weight:300;">${nftDescription}</p>` : ""}

              <!-- Buttons -->
              <div style="margin:24px 0;">
                ${nftViewUrl ? `
                  <a href="${nftViewUrl}" style="display:block;padding:10px 24px;border:1px solid #2483ff66;color:#2483ff;text-decoration:none;font-size:11px;font-weight:400;text-transform:uppercase;letter-spacing:0.05em;background:rgba(36,131,255,0.08);margin-bottom:12px;">
                    ${getButtonText()}
                  </a>
                ` : ""}
                <a href="${walletViewUrl}" style="display:block;padding:10px 24px;border:1px solid #2483ff66;color:#2483ff;text-decoration:none;font-size:11px;font-weight:400;text-transform:uppercase;letter-spacing:0.05em;">
                  VIEW WALLET
                </a>
              </div>

              <hr style="border:none;border-top:1px solid #2483ff33;margin:24px 0;" />

              <p style="font-size:10px;text-transform:uppercase;letter-spacing:0.2em;color:#2483ff99;margin:0;">
                KAIROS
              </p>
            </td></tr>
          </table>
        </td></tr>
      </table>
    </body>
    </html>
  `;

  const text = `
${getStatusMessage()}

${nftName ? `NFT: ${nftName}` : ""}
${nftDescription ? `Description: ${nftDescription}` : ""}

Wallet: ${userAddress}
${tokenId ? `Token ID: ${tokenId}` : ""}
${contractAddress ? `Contract: ${contractAddress}` : ""}

${nftViewUrl ? `View NFT: ${nftViewUrl}` : ""}
View Wallet: ${walletViewUrl}
  `.trim();

  return { subject, html, text };
}
