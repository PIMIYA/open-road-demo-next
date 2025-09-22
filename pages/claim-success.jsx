import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Button,
  Container,
  Typography,
  Stack,
  Paper,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";

const Item = styled(Paper)(({ theme }) => ({
  textAlign: "center",
  boxShadow: "none",
  padding: theme.spacing(4),
}));

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

  // 背景寄信函數
  const sendEmailInBackground = async (emailData) => {
    try {
      console.log("📧 Sending email in background...");
      fetch(`/api/send-claim-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(emailData),
      })
        .then((response) => {
          if (response.ok) {
            console.log("✅ Background email sent successfully");
            setEmailSent(true);
          } else {
            console.error("❌ Background email failed:", response.status);
          }
        })
        .catch((error) => {
          console.error("❌ Background email error:", error);
        });
    } catch (error) {
      console.error("❌ Background email setup error:", error);
    }
  };

  useEffect(() => {
    // 檢查訪問權限
    const status = localStorage.getItem("claimStatus");
    const userEmail = localStorage.getItem("userEmail");
    const userWalletAddress = localStorage.getItem("userWalletAddress");

    // 只有成功領取或已領取過的人才能訪問
    if (
      !status ||
      (!status.includes("success") && !status.includes("alreadyClaimed"))
    ) {
      console.log("❌ Unauthorized access to claim-success page");
      router.push("/");
      return;
    }

    console.log("status is : ", status);
    console.log("userEmail is : ", userEmail);
    console.log("userWalletAddress is : ", userWalletAddress);

    setIsAuthorized(true);
    setClaimStatus(status);

    // 從 URL 參數或 localStorage 獲取用戶地址和 tokenId
    const { address, tokenId: urlTokenId, contract } = router.query;

    if (address) {
      setUserAddress(address);
    } else {
      const storedAddress = localStorage.getItem("userWalletAddress");
      if (storedAddress) {
        setUserAddress(storedAddress);
      }
    }

    if (urlTokenId) {
      setTokenId(urlTokenId);
    } else {
      const storedTokenId = localStorage.getItem("claimedTokenId");
      if (storedTokenId) {
        setTokenId(storedTokenId);
      }
    }

    if (contract) {
      setContractAddress(contract);
    } else {
      const storedContract = localStorage.getItem("claimedContract");
      if (storedContract) {
        // 處理可能的 [object Object] 情況
        try {
          const parsedContract = JSON.parse(storedContract);
          setContractAddress(parsedContract.address || parsedContract);
        } catch (e) {
          setContractAddress(storedContract);
        }
      }
    }

    // 準備郵件數據並發送（只有成功領取時才發送）
    const nftName = localStorage.getItem("nftName");
    const nftDescription = localStorage.getItem("nftDescription");
    const nftImageUrl = localStorage.getItem("nftImageUrl");

    // if (status === "success" && userEmail && userWalletAddress) {
    const emailData = {
      email: userEmail,
      userAddress: userWalletAddress,
      tokenId: tokenId,
      contractAddress: contractAddress,
      claimStatus: status,
      nftName: nftName || "NFT",
      nftDescription: nftDescription || "",
      nftImageUrl: nftImageUrl || "",
    };

    console.log("emailData is : ", emailData);

    // 在背景發送郵件
    sendEmailInBackground(emailData);

    // 清除郵件相關的 localStorage
    localStorage.removeItem("userEmail");
    localStorage.removeItem("nftName");
    localStorage.removeItem("nftDescription");
    localStorage.removeItem("nftImageUrl");
    // }

    // 清除 claim 狀態
    localStorage.removeItem("claimStatus");
  }, [router.query, userAddress, tokenId, contractAddress]);

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

  const handleViewNFT = () => {
    if (tokenId && contractAddress) {
      router.push(`/claimsToken/${contractAddress}/${tokenId}`);
    } else {
      alert("無法獲取 NFT Token ID，請確保您已經成功領取了 NFT");
    }
  };

  const handleViewWallet = () => {
    if (userAddress) {
      router.push(`/wallet/${userAddress}`);
    } else {
      alert("無法獲取錢包地址");
    }
  };

  // 如果未授權，顯示載入中或重定向
  if (!isAuthorized) {
    return (
      <Box
        sx={{
          background: "#f5f5f5",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography variant="h6">載入中...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ background: "#f5f5f5", minHeight: "100vh" }}>
      <Container maxWidth="md">
        <Box py={8}>
          <Stack direction="column" spacing={4} alignItems="center">
            {/* 成功圖標 */}
            <CheckCircleIcon
              sx={{
                fontSize: 80,
                color: "#4caf50",
                mb: 2,
              }}
            />

            {/* 成功標題 */}
            <Typography
              variant="h3"
              component="h1"
              textAlign="center"
              gutterBottom
            >
              領取完成！
            </Typography>

            <Typography
              variant="h6"
              component="p"
              textAlign="center"
              color="text.secondary"
              mb={4}
            >
              {getStatusMessage()}
            </Typography>

            {/* 郵件狀態提示 - 只有成功領取時才顯示 */}
            {claimStatus === "success" && emailSent && (
              <Typography variant="body2" color="success.main" sx={{ mb: 2 }}>
                📧 確認郵件已發送到您的信箱
              </Typography>
            )}

            {/* 按鈕容器 */}
            <Item sx={{ width: "100%", maxWidth: 400 }}>
              <Stack direction="column" spacing={3}>
                {/* 查看 NFT 按鈕 */}
                <Button
                  variant="contained"
                  size="large"
                  fullWidth
                  startIcon={<VisibilityIcon />}
                  onClick={handleViewNFT}
                  disabled={!tokenId || !contractAddress}
                  sx={{
                    py: 2,
                    fontSize: "1.1rem",
                    backgroundColor:
                      tokenId && contractAddress ? "#1976d2" : "#ccc",
                    "&:hover": {
                      backgroundColor:
                        tokenId && contractAddress ? "#1565c0" : "#ccc",
                    },
                  }}
                >
                  {getButtonText()}
                </Button>

                {/* 查看錢包按鈕 */}
                <Button
                  variant="outlined"
                  size="large"
                  fullWidth
                  startIcon={<AccountBalanceWalletIcon />}
                  onClick={handleViewWallet}
                  disabled={!userAddress}
                  sx={{
                    py: 2,
                    fontSize: "1.1rem",
                    borderColor: userAddress ? "#1976d2" : "#ccc",
                    color: userAddress ? "#1976d2" : "#ccc",
                    "&:hover": {
                      borderColor: userAddress ? "#1565c0" : "#ccc",
                      backgroundColor: userAddress
                        ? "rgba(25, 118, 210, 0.04)"
                        : "transparent",
                    },
                  }}
                >
                  看看自己錢包
                </Button>
              </Stack>
            </Item>

            {/* 調試信息 - 正式環境時可以移除 */}
            <Item sx={{ width: "100%", maxWidth: 600, mt: 2 }}>
              <Typography variant="h6" gutterBottom>
                調試信息 (Debug Info)
              </Typography>
              <Box
                sx={{
                  textAlign: "left",
                  fontFamily: "monospace",
                  fontSize: "0.8rem",
                }}
              >
                <Typography variant="body2">
                  <strong>Claim 狀態:</strong> {claimStatus || "未獲取"}
                </Typography>
                <Typography variant="body2">
                  <strong>用戶錢包地址:</strong> {userAddress || "未獲取"}
                </Typography>
                <Typography variant="body2">
                  <strong>NFT Token ID:</strong> {tokenId || "未獲取"}
                </Typography>
                <Typography variant="body2">
                  <strong>NFT 合約地址:</strong> {contractAddress || "未獲取"}
                </Typography>
                <Typography variant="body2">
                  <strong>NFT 查看連結:</strong>{" "}
                  {tokenId && contractAddress
                    ? `/claimsToken/${contractAddress}/${tokenId}`
                    : "無法生成"}
                </Typography>
                <Typography variant="body2">
                  <strong>錢包查看連結:</strong>{" "}
                  {userAddress ? `/wallet/${userAddress}` : "無法生成"}
                </Typography>
                <Typography variant="body2">
                  <strong>郵件狀態:</strong>{" "}
                  {claimStatus === "success"
                    ? emailSent
                      ? "已發送"
                      : "發送中..."
                    : "不發送"}
                </Typography>
                <Typography variant="body2">
                  <strong>訪問權限:</strong>{" "}
                  {isAuthorized ? "已授權" : "未授權"}
                </Typography>
              </Box>
            </Item>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}