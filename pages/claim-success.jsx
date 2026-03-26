import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Button,
  Container,
  Divider,
  Typography,
  Stack,
} from "@mui/material";

export default function ClaimSuccess() {
  const router = useRouter();
  const [userAddress, setUserAddress] = useState("");
  const [tokenId, setTokenId] = useState("");
  const [contractAddress, setContractAddress] = useState(
    "KT1PTS3pPk4FeneMmcJ3HZVe39wra1bomsaW"
  );
  const [claimStatus, setClaimStatus] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  const sendEmailInBackground = async (emailData) => {
    try {
      fetch(`/api/send-claim-email-http-background`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emailData),
      })
        .then((response) => {
          if (response.ok) {
            setEmailSent(true);
          }
        })
        .catch((error) => {
          console.error("Background email error:", error);
        });
    } catch (error) {
      console.error("Background email setup error:", error);
    }
  };

  useEffect(() => {
    const status = localStorage.getItem("claimStatus");
    const userEmail = localStorage.getItem("userEmail");
    const userWalletAddress = localStorage.getItem("userWalletAddress");

    setIsAuthorized(true);
    setClaimStatus(status);

    const storedAddress = localStorage.getItem("userWalletAddress");
    const storedTokenId = localStorage.getItem("claimedTokenId");
    const storedContract = localStorage.getItem("claimedContract");

    if (storedAddress) setUserAddress(storedAddress);
    if (storedTokenId) setTokenId(storedTokenId);

    if (storedContract) {
      try {
        const parsedContract = JSON.parse(storedContract);
        setContractAddress(parsedContract.address || parsedContract);
      } catch (e) {
        setContractAddress(storedContract);
      }
    }

    const nftName = localStorage.getItem("nftName");
    const nftDescription = localStorage.getItem("nftDescription");
    const nftImageUrl = localStorage.getItem("nftImageUrl");

    let finalContractAddress = storedContract;
    if (storedContract) {
      try {
        const parsedContract = JSON.parse(storedContract);
        finalContractAddress = parsedContract.address || parsedContract;
      } catch (e) {
        finalContractAddress = storedContract;
      }
    }

    const emailData = {
      email: userEmail,
      userAddress: userWalletAddress,
      tokenId: storedTokenId,
      contractAddress: finalContractAddress,
      claimStatus: status,
      nftName: nftName || "NFT",
      nftDescription: nftDescription || "",
      nftImageUrl: nftImageUrl || "",
    };

    sendEmailInBackground(emailData);

    localStorage.removeItem("userEmail");
    localStorage.removeItem("nftName");
    localStorage.removeItem("nftDescription");
    localStorage.removeItem("nftImageUrl");
    localStorage.removeItem("claimStatus");
  }, [router.query, userAddress, tokenId, contractAddress]);

  const getStatusMessage = () => {
    switch (claimStatus) {
      case "success":
        return "NFT CLAIMED SUCCESSFULLY";
      case "alreadyClaimed":
        return "ALREADY CLAIMED";
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

  const handleViewNFT = () => {
    if (tokenId && contractAddress) {
      router.push(`/claimsToken/${contractAddress}/${tokenId}`);
    }
  };

  const handleViewWallet = () => {
    if (userAddress) {
      router.push(`/wallet/${userAddress}`);
    }
  };

  if (!isAuthorized) {
    return (
      <Box
        sx={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="overline">LOADING...</Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
      <Stack spacing={5} alignItems="center">
        {/* Status indicator */}
        <Box sx={{ width: 64, height: 64 }}>
          <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" width="64" height="64">
            <rect x="0.5" y="0.5" width="63" height="63" stroke="#25e56b" />
            <path d="M18 33 L27 42 L46 22" stroke="#25e56b" strokeWidth="2" fill="none" />
          </svg>
        </Box>

        {/* Title */}
        <Typography variant="h2" component="h1">
          {getStatusMessage()}
        </Typography>

        <Divider sx={{ width: "100%", my: 2 }} />

        {/* Email confirmation */}
        {claimStatus === "success" && emailSent && (
          <Typography variant="caption" color="success.main">
            CONFIRMATION EMAIL SENT
          </Typography>
        )}

        {/* Actions */}
        <Stack spacing={3} sx={{ width: "100%", maxWidth: 360 }}>
          <Button
            variant="outlined"
            size="large"
            fullWidth
            onClick={handleViewNFT}
            disabled={!tokenId || !contractAddress}
            sx={{
              backgroundColor: "rgba(36, 131, 255, 0.08)",
              "@media (hover: hover)": {
                "&:hover": {
                  backgroundColor: "rgba(36, 131, 255, 0.15)",
                },
              },
            }}
          >
            {getButtonText()}
          </Button>

          <Button
            variant="outlined"
            size="large"
            fullWidth
            onClick={handleViewWallet}
            disabled={!userAddress}
          >
            VIEW WALLET
          </Button>
        </Stack>
      </Stack>
    </Container>
  );
}
