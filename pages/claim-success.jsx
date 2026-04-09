import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Button,
  Container,
  Typography,
  Stack,
  TextField,
} from "@mui/material";
import ButtonSpinner from "@/components/ButtonSpinner";
import { getAkaswapAssetUrl } from "@/lib/stringUtils";
import { useT } from "@/lib/i18n/useT";

const BRAND = "var(--brand-secondary)";

export default function ClaimSuccess() {
  const t = useT();
  const router = useRouter();
  const [userAddress, setUserAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [contractAddress, setContractAddress] = useState(
    "KT1PTS3pPk4FeneMmcJ3HZVe39wra1bomsaW"
  );
  const [claimStatus, setClaimStatus] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [nftImageUrl, setNftImageUrl] = useState("");
  const [nftName, setNftName] = useState("");

  // Leave-a-message state
  const [commentMessage, setCommentMessage] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [commentDone, setCommentDone] = useState(false);
  const [commentError, setCommentError] = useState("");
  const [existingComment, setExistingComment] = useState(null); // null = not checked, "" = no comment, string = existing
  const [commentLoading, setCommentLoading] = useState(true); // loading until check is done

  const sendEmailInBackground = async (emailData) => {
    try {
      fetch(`/api/send-claim-email-http-background`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      })
        .then((response) => {
          if (response.ok) setEmailSent(true);
        })
        .catch((error) => console.error("Background email error:", error));
    } catch (error) {
      console.error("Background email setup error:", error);
    }
  };

  useEffect(() => {
    // Support both localStorage (after claim) and query params (from email link)
    const qTokenId = router.query.tokenId;
    const qContract = router.query.contract;
    const qWallet = router.query.wallet;
    const qAction = router.query.action;

    const status = localStorage.getItem("claimStatus");

    setIsAuthorized(true);
    setClaimStatus(status);

    const storedAddress = qWallet || localStorage.getItem("userWalletAddress");
    const storedTokenId = qTokenId || localStorage.getItem("claimedTokenId");
    const storedContract = qContract || localStorage.getItem("claimedContract");
    const storedNftName = localStorage.getItem("nftName") || "";
    const storedNftImageUrl = localStorage.getItem("nftImageUrl") || "";

    if (storedAddress) setUserAddress(storedAddress);
    if (storedTokenId) setTokenId(storedTokenId);
    if (storedNftName) setNftName(storedNftName);

    // Resolve IPFS URI to full URL
    if (storedNftImageUrl) {
      setNftImageUrl(
        storedNftImageUrl.startsWith("ipfs://")
          ? getAkaswapAssetUrl(storedNftImageUrl)
          : storedNftImageUrl
      );
    }

    // Parse contract address
    let finalContractAddress = storedContract;
    if (storedContract) {
      try {
        const parsed = JSON.parse(storedContract);
        finalContractAddress = parsed.address || parsed;
      } catch {
        finalContractAddress = storedContract;
      }
      setContractAddress(finalContractAddress);
    }

    // Fallback: fetch image from TzKT if not in localStorage
    const effectiveContract = finalContractAddress || "KT1PTS3pPk4FeneMmcJ3HZVe39wra1bomsaW";
    if (!storedNftImageUrl && storedTokenId) {
      fetch(`https://api.tzkt.io/v1/tokens?contract=${effectiveContract}&tokenId=${storedTokenId}`)
        .then((r) => r.json())
        .then((tokens) => {
          const meta = tokens?.[0]?.metadata;
          if (meta) {
            const uri = meta.displayUri || meta.thumbnailUri || meta.image || "";
            if (uri) setNftImageUrl(uri.startsWith("ipfs://") ? getAkaswapAssetUrl(uri) : uri);
            if (!storedNftName && meta.name) setNftName(meta.name);
          }
        })
        .catch(() => {});
    }

    // Send confirmation email (only on direct claim flow, not email link)
    const userEmail = localStorage.getItem("userEmail");
    if (userEmail && !qAction) {
      sendEmailInBackground({
        email: userEmail,
        userAddress: storedAddress,
        tokenId: storedTokenId,
        contractAddress: effectiveContract,
        claimStatus: status,
        nftName: storedNftName || "NFT",
        nftDescription: localStorage.getItem("nftDescription") || "",
        nftImageUrl: storedNftImageUrl,
        locale: router.locale || "zh",
      });
    }

    // Check if this wallet already left a comment (edge case: revisit)
    if (storedTokenId && storedAddress) {
      fetch("/api/get-comments-byTokenID", { method: "POST", body: storedTokenId })
        .then((r) => r.json())
        .then((r) => {
          const comments = r?.data?.data || r?.data || [];
          if (Array.isArray(comments)) {
            const mine = comments.find((c) => c.walletAddress === storedAddress);
            if (mine) {
              setExistingComment(mine.message || mine.comment || "");
            }
          }
        })
        .catch(() => {})
        .finally(() => setCommentLoading(false));
    } else {
      setCommentLoading(false);
    }

    // Clean up localStorage
    localStorage.removeItem("userEmail");
    localStorage.removeItem("nftDescription");
    localStorage.removeItem("claimStatus");
  }, [router.query]);

  // Delayed cleanup for image/name (after state is set)
  useEffect(() => {
    if (nftImageUrl || nftName) {
      localStorage.removeItem("nftName");
      localStorage.removeItem("nftImageUrl");
    }
  }, [nftImageUrl, nftName]);

  const getStatusMessage = () => {
    switch (claimStatus) {
      case "success": return t.claim.success;
      case "alreadyClaimed": return t.claim.alreadyClaimed;
      default: return t.claim.completed;
    }
  };

  const getButtonText = () => {
    switch (claimStatus) {
      case "success": return t.claim.viewNft;
      case "alreadyClaimed": return t.claim.viewMyNft;
      default: return t.claim.viewNft;
    }
  };

  const handleSubmitComment = async () => {
    if (!commentMessage.trim() || !tokenId || !userAddress) return;
    setCommentSubmitting(true);
    setCommentError("");
    try {
      const response = await fetch("/api/post-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenID: tokenId,
          walletAddress: userAddress,
          contractAddress,
          message: commentMessage.trim(),
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Error ${response.status}`);
      }
      setCommentDone(true);
    } catch (err) {
      setCommentError(err.message);
    } finally {
      setCommentSubmitting(false);
    }
  };

  if (!isAuthorized) {
    return (
      <Box sx={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Typography variant="overline">{t.common.loading}</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 10, textAlign: "center", position: "relative" }}>
      <Stack spacing={5} alignItems="center">
        {/* Status indicator */}
        <Box sx={{ width: 64, height: 64 }}>
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
            <rect x="0.5" y="0.5" width="63" height="63" stroke="var(--brand-primary)" />
            <path d="M18 33 L27 42 L46 22" stroke="var(--brand-primary)" strokeWidth="2" fill="none" />
          </svg>
        </Box>

        {/* Title */}
        <Typography variant="h2" component="h1">
          {getStatusMessage()}
        </Typography>

        {/* Email confirmation */}
        {claimStatus === "success" && emailSent && (
          <Typography variant="caption" color="success.main">
            {t.claim.emailSent}
          </Typography>
        )}

        {/* NFT Image (top-level, not inside comment card) */}
        {nftImageUrl && (
          <Box sx={{ width: "100%", maxWidth: 360 }}>
            <Box
              component="img"
              src={nftImageUrl}
              alt={nftName || "NFT"}
              sx={{
                width: "100%",
                maxHeight: 320,
                objectFit: "contain",
                display: "block",
                mx: "auto",
              }}
            />
          </Box>
        )}

        {/* NFT Name */}
        {nftName && (
          <Typography sx={{ fontSize: 14, fontWeight: "bold", color: BRAND }}>
            {nftName}
          </Typography>
        )}

        {/* Leave a message section */}
        {tokenId && userAddress && !commentLoading && (
          <Box
            sx={{
              width: "100%",
              maxWidth: 360,
              border: "1px solid",
              borderColor: BRAND,
              borderRadius: "10px",
              p: 3,
              textAlign: "left",
            }}
          >
            {/* State 1: Just submitted successfully */}
            {commentDone && (
              <>
                <Typography
                  sx={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "success.main", mb: 0.5 }}
                >
                  {t.comment.messageSent}
                </Typography>
                <Typography sx={{ fontSize: 13, color: "text.primary", whiteSpace: "pre-wrap", mt: 1 }}>
                  {commentMessage}
                </Typography>
              </>
            )}

            {/* State 2: Revisit — already has an existing comment */}
            {!commentDone && existingComment && (
              <>
                <Typography
                  sx={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: BRAND, mb: 0.5 }}
                >
                  {t.comment.yourMessage}
                </Typography>
                <Typography sx={{ fontSize: 13, color: "text.primary", whiteSpace: "pre-wrap", mt: 1 }}>
                  {existingComment}
                </Typography>
              </>
            )}

            {/* State 3: First visit — show input form */}
            {!commentDone && !existingComment && (
              <>
                <Typography
                  sx={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: BRAND, mb: 1.5 }}
                >
                  {t.comment.leaveMessage}
                </Typography>
                <TextField
                  placeholder={t.comment.placeholder}
                  multiline
                  rows={3}
                  fullWidth
                  variant="outlined"
                  value={commentMessage}
                  onChange={(e) => setCommentMessage(e.target.value)}
                  disabled={commentSubmitting}
                  sx={{
                    mb: 2,
                    "& .MuiOutlinedInput-root": {
                      fontSize: 13,
                      "& fieldset": { borderColor: BRAND },
                      "&.Mui-focused fieldset": { borderColor: BRAND },
                    },
                  }}
                />
                {commentError && (
                  <Typography variant="caption" color="error.main" sx={{ mb: 1, display: "block" }}>
                    {commentError}
                  </Typography>
                )}
                <Stack direction="row" spacing={2} justifyContent="flex-end">
                  <Button
                    variant="contained"
                    onClick={handleSubmitComment}
                    disabled={!commentMessage.trim() || commentSubmitting}
                    sx={{
                      bgcolor: BRAND,
                      color: "#fff",
                      fontSize: 11,
                      "@media (hover: hover)": {
                        "&:hover": { bgcolor: "var(--brand-primary)" },
                      },
                    }}
                  >
                    {commentSubmitting && <ButtonSpinner color="#fff" />}
                    {commentSubmitting ? t.common.sending : t.common.submit}
                  </Button>
                </Stack>
              </>
            )}
          </Box>
        )}

        {/* Action buttons */}
        <Stack spacing={3} sx={{ width: "100%", maxWidth: 360 }}>
          <Button
            variant="outlined"
            size="large"
            fullWidth
            onClick={() => tokenId && contractAddress && router.push(`/claimsToken/${contractAddress}/${tokenId}`)}
            disabled={!tokenId || !contractAddress}
            sx={{
              backgroundColor: "rgba(36, 131, 255, 0.08)",
              "@media (hover: hover)": {
                "&:hover": { backgroundColor: "rgba(36, 131, 255, 0.15)" },
              },
            }}
          >
            {getButtonText()}
          </Button>

          <Button
            variant="outlined"
            size="large"
            fullWidth
            onClick={() => userAddress && router.push(`/wallet/${userAddress}`)}
            disabled={!userAddress}
          >
            {t.claim.viewWallet}
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
