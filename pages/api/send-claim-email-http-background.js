import { getT } from "@/lib/i18n/getT";

async function sendWithResend({ to, subject, html, text }) {
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
      text,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Resend ${res.status}: ${body}`);
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
    locale = "zh",
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
    locale,
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
  locale,
}) {
  const { subject, html, text } = generateEmailContent({
    userAddress,
    tokenId,
    contractAddress,
    claimStatus,
    nftName,
    nftDescription,
    nftImageUrl,
    locale,
  });

  try {
    await sendWithResend({ to: email, subject, html, text });
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
  nftImageUrl,
  locale,
}) {
  const t = getT(locale || "zh");

  const getStatusMessage = () => {
    switch (claimStatus) {
      case "success":
        return t.claim.success;
      case "alreadyClaimed":
        return t.claim.alreadyClaimed;
      case "soldOut":
        return t.claim.soldOut;
      case "invalid":
        return t.claim.failed;
      case "error":
        return t.claim.error;
      default:
        return t.claim.completed;
    }
  };

  const getButtonText = () => {
    switch (claimStatus) {
      case "success":
        return t.claim.viewNft;
      case "alreadyClaimed":
        return t.claim.viewMyNft;
      default:
        return t.claim.viewNft;
    }
  };

  // Resolve IPFS image to a displayable URL
  const resolvedImageUrl = nftImageUrl
    ? nftImageUrl.startsWith("ipfs://")
      ? `https://assets.akaswap.com/ipfs/${nftImageUrl.replace("ipfs://", "")}`
      : nftImageUrl
    : null;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

  const nftViewUrl =
    tokenId && contractAddress && tokenId !== "" && contractAddress !== ""
      ? `${baseUrl}/claimsToken/${contractAddress}/${tokenId}`
      : null;

  const walletViewUrl = `${baseUrl}/wallet/${userAddress}`;

  const commentUrl =
    tokenId && userAddress
      ? `${baseUrl}/wallet/${userAddress}?comment=${tokenId}`
      : null;

  const subject = `${t.email.subject}${nftName || "NFT"}`;

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

              <!-- Logo top-left -->
              <div style="text-align:left;margin-bottom:24px;">
                <a href="${baseUrl}" style="text-decoration:none;">
                  <img src="https://kairos-mint.art/logo.svg" alt="KAIROS" width="60" height="30" style="width:60px;height:auto;" />
                </a>
              </div>

              ${resolvedImageUrl ? `
                <div style="margin:0 0 24px;text-align:center;">
                  <img src="${resolvedImageUrl}" alt="${nftName || 'NFT'}" style="max-width:100%;max-height:280px;object-fit:contain;" />
                </div>
              ` : ""}
              ${nftName ? `<p style="font-size:14px;color:#2483ff;margin:0 0 24px;font-weight:300;">${nftName}</p>` : ""}
              ${nftDescription ? `<p style="font-size:13px;color:#2483ff99;margin:0 0 24px;font-weight:300;">${nftDescription}</p>` : ""}

              <!-- Buttons -->
              <div style="margin:24px 0;">
                ${commentUrl ? `
                  <a href="${commentUrl}" style="display:block;padding:10px 24px;border:1px solid #ed502466;color:#ed5024;text-decoration:none;font-size:11px;font-weight:400;text-transform:uppercase;letter-spacing:0.05em;margin-bottom:12px;">
                    ${t.email.leaveMessage}
                  </a>
                ` : ""}
                ${nftViewUrl ? `
                  <a href="${nftViewUrl}" style="display:block;padding:10px 24px;border:1px solid #2483ff66;color:#2483ff;text-decoration:none;font-size:11px;font-weight:400;text-transform:uppercase;letter-spacing:0.05em;background:rgba(36,131,255,0.08);margin-bottom:12px;">
                    ${getButtonText()}
                  </a>
                ` : ""}
                <a href="${walletViewUrl}" style="display:block;padding:10px 24px;border:1px solid #2483ff66;color:#2483ff;text-decoration:none;font-size:11px;font-weight:400;text-transform:uppercase;letter-spacing:0.05em;">
                  ${t.claim.viewWallet}
                </a>
              </div>

              <hr style="border:none;border-top:1px solid #2483ff33;margin:24px 0;" />

              <!-- Footer -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="vertical-align:bottom;padding-bottom:0;">
                    <!-- Logo left -->
                    <svg width="60" height="30" viewBox="0 0 121 60" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M25.6821 17.784C25.4087 17.784 25.272 17.6375 25.272 17.3445V9.82109C25.272 9.52812 25.4087 9.38164 25.6821 9.38164H26.5728C26.8462 9.38164 26.9829 9.52812 26.9829 9.82109V12.1531C26.9829 12.3875 26.9731 12.6219 26.9536 12.8562H26.9946L29.8423 9.72734C30.0532 9.49687 30.2329 9.38164 30.3813 9.38164H31.5591C32.0161 9.38164 32.0903 9.54961 31.7817 9.88554L29.1157 12.8035L31.9692 17.2801C32.1841 17.616 32.1099 17.784 31.7466 17.784H30.6509C30.4478 17.784 30.272 17.6687 30.1235 17.4383L27.9673 14.0574L26.9829 15.1648V17.3445C26.9829 17.6375 26.8462 17.784 26.5728 17.784H25.6821Z" fill="#2483ff"/>
                      <path d="M60.6716 16.591C60.3904 16.591 60.2986 16.4621 60.3962 16.2043L63.2673 8.6633C63.3884 8.34689 63.572 8.18869 63.8181 8.18869H64.6384C64.8845 8.18869 65.0681 8.34689 65.1892 8.6633L68.0603 16.2043C68.158 16.4621 68.0662 16.591 67.7849 16.591H66.8533C66.5955 16.591 66.4158 16.4563 66.3142 16.1867L65.7166 14.6106H62.74L62.1423 16.1867C62.0408 16.4563 61.8611 16.591 61.6033 16.591H60.6716Z" fill="#2483ff"/>
                      <path d="M89.3533 11.9999C89.0798 11.9999 88.9431 11.8535 88.9431 11.5605V4.03705C88.9431 3.74408 89.0798 3.5976 89.3533 3.5976H90.2439C90.5173 3.5976 90.6541 3.74408 90.6541 4.03705V11.5605C90.6541 11.8535 90.5173 11.9999 90.2439 11.9999H89.3533Z" fill="#2483ff"/>
                      <path d="M61.3867 40.172C61.1133 40.172 60.9766 40.0255 60.9766 39.7325V32.2091C60.9766 31.9161 61.1133 31.7696 61.3867 31.7696H64.0996C65.3066 31.7696 66.1875 31.9571 66.7422 32.3321C67.2969 32.7032 67.5742 33.3087 67.5742 34.1485C67.5742 34.7735 67.3496 35.2716 66.9004 35.6427C66.4512 36.0138 65.8809 36.2599 65.1895 36.381V36.3927C65.5645 36.5333 65.8477 36.7286 66.0391 36.9786C66.2305 37.2286 66.3867 37.4474 66.5078 37.6349L67.7969 39.6681C68.0117 40.004 67.9375 40.172 67.5742 40.172H66.5547C66.3398 40.172 66.1641 40.0567 66.0273 39.8263L64.8438 37.8517C64.7148 37.6407 64.4785 37.4103 64.1348 37.1603C63.7949 36.9064 63.457 36.7794 63.1211 36.7794H62.6875V39.7325C62.6875 40.0255 62.5508 40.172 62.2773 40.172H61.3867Z" fill="#2483ff"/>
                      <path d="M85.5039 45.7988C85.5039 44.4512 85.8516 43.3809 86.5469 42.5879C87.2422 41.7949 88.2344 41.3984 89.5234 41.3984C90.8125 41.3984 91.8047 41.7949 92.5 42.5879C93.1953 43.3809 93.543 44.4512 93.543 45.7988C93.543 47.1465 93.1953 48.2168 92.5 49.0098C91.8047 49.8027 90.8125 50.1992 89.5234 50.1992C88.2344 50.1992 87.2422 49.8027 86.5469 49.0098C85.8516 48.2168 85.5039 47.1465 85.5039 45.7988Z" fill="#2483ff"/>
                      <path d="M114.045 35.3748C113.802 35.1912 113.744 35.0056 113.869 34.8181L114.32 34.1385C114.469 33.9158 114.685 33.9041 114.97 34.1033C115.189 34.2556 115.474 34.4138 115.826 34.5779C116.181 34.7381 116.554 34.8181 116.945 34.8181C117.219 34.8181 117.482 34.7869 117.736 34.7244C117.99 34.6619 118.183 34.5408 118.316 34.3611C118.449 34.1814 118.515 33.9685 118.515 33.7224C118.515 33.5467 118.486 33.3924 118.427 33.2596C118.369 33.1267 118.273 33.0174 118.14 32.9314C118.008 32.8455 117.871 32.7732 117.73 32.7146C117.484 32.6131 117.174 32.5135 116.799 32.4158C116.427 32.3142 116.06 32.1931 115.697 32.0525C115.373 31.9275 115.076 31.7556 114.806 31.5369C114.537 31.3181 114.328 31.0721 114.179 30.7986C114.031 30.5252 113.957 30.1599 113.957 29.7029C113.957 29.1599 114.133 28.6951 114.484 28.3084C114.836 27.9217 115.24 27.6736 115.697 27.5642C116.154 27.4549 116.615 27.4002 117.08 27.4002C117.541 27.4002 118.015 27.4705 118.504 27.6111C118.996 27.7517 119.367 27.9275 119.617 28.1385C119.863 28.3455 119.924 28.533 119.799 28.701L119.324 29.3396C119.164 29.5584 118.949 29.576 118.679 29.3924C118.508 29.2752 118.271 29.1443 117.97 28.9998C117.674 28.8553 117.363 28.783 117.039 28.783C116.808 28.783 116.595 28.8025 116.4 28.8416C116.209 28.8806 116.039 28.9744 115.89 29.1228C115.742 29.2713 115.668 29.4549 115.668 29.6736C115.668 29.8846 115.722 30.0564 115.832 30.1892C115.941 30.3181 116.062 30.4158 116.195 30.4822C116.328 30.5447 116.463 30.5974 116.599 30.6404C117.021 30.7771 117.398 30.8982 117.73 31.0037C118.062 31.1053 118.369 31.2185 118.65 31.3435C119.041 31.5193 119.34 31.6951 119.547 31.8709C119.754 32.0467 119.924 32.2869 120.056 32.5916C120.193 32.8963 120.261 33.2596 120.261 33.6814C120.261 34.3064 120.062 34.824 119.664 35.2342C119.265 35.6404 118.822 35.9021 118.334 36.0193C117.849 36.1404 117.377 36.201 116.916 36.201C116.236 36.201 115.683 36.1346 115.258 36.0017C114.832 35.8728 114.427 35.6638 114.045 35.3748Z" fill="#2483ff"/>
                      <path d="M69.3359 8.67741C73.2009 4.88971 78.5047 2.50015 84.5051 4.00024" stroke="#2483ff" stroke-linecap="round"/>
                      <path d="M94.006 14.0008C97.8092 23.0901 75.5004 21.9994 69.5 31.5" stroke="#2483ff" stroke-linecap="round"/>
                      <path d="M93 39.7998C97.5 33.5 103.5 29 111.501 30.6764" stroke="#2483ff" stroke-linecap="round"/>
                      <path d="M36 18C43.5199 24.6667 49.5111 24.6667 57 18" stroke="#2483ff" stroke-linecap="round"/>
                      <path d="M62.0001 44.5C60.5 50.5 70.5003 59.5 82.5002 50.5" stroke="#2483ff" stroke-linecap="round"/>
                      <path d="M14 33C16.5 39.5 30.5 48 38 48" stroke="#2483ff" stroke-linecap="round"/>
                    </svg>
                  </td>
                  <td style="vertical-align:bottom;text-align:right;">
                    <!-- Links right -->
                    <a href="${baseUrl}/faq" style="font-size:10px;color:#2483ff99;text-decoration:none;display:block;line-height:1.8;">${t.footer.faq}</a>
                    <a href="${baseUrl}/privacy_policy" style="font-size:10px;color:#2483ff99;text-decoration:none;display:block;line-height:1.8;">${t.footer.privacy}</a>
                    <a href="${baseUrl}/terms_of_service" style="font-size:10px;color:#2483ff99;text-decoration:none;display:block;line-height:1.8;">${t.footer.terms}</a>
                    <p style="font-size:9px;color:#2483ff66;margin:4px 0 0;">${t.footer.copyright}</p>
                  </td>
                </tr>
              </table>
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
${nftDescription ? nftDescription : ""}

${nftViewUrl ? `${t.claim.viewNft}: ${nftViewUrl}` : ""}
${t.claim.viewWallet}: ${walletViewUrl}
${commentUrl ? `${t.email.leaveMessage}: ${commentUrl}` : ""}
  `.trim();

  return { subject, html, text };
}
