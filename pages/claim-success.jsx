import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Box,
  Button,
  Container,
  Typography,
  Stack,
  Paper,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import VisibilityIcon from "@mui/icons-material/Visibility";
import AccountBalanceWalletIcon from "@mui/icons-material/AccountBalanceWallet";
import MessageIcon from "@mui/icons-material/Message";

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
  
  // 留言相關狀態
  const [openDialog, setOpenDialog] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const [messageStatus, setMessageStatus] = useState("");

  useEffect(() => {
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

    // 獲取 claim 狀態
    const status = localStorage.getItem("claimStatus");
    setClaimStatus(status);

    // 清除狀態
    localStorage.removeItem("claimStatus");
  }, [router.query]);

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

  const handleOpenMessageDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setUserMessage("");
    setMessageStatus("");
  };

  const handleSubmitMessage = async () => {
    if (!userMessage.trim()) {
      setMessageStatus("請輸入留言內容");
      return;
    }

    try {
      const response = await fetch("/api/post-comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenID: tokenId,
          walletAddress: userAddress,
          message: userMessage,
        }),
      });

      let statusMessage = "";
      switch (response.status) {
        case 200:
          statusMessage = "留言提交成功！";
          break;
        case 201:
          statusMessage = "留言創建成功！";
          break;
        case 400:
          statusMessage = "留言格式無效，請檢查輸入內容。";
          break;
        case 403:
          statusMessage = "您沒有權限提交留言。";
          break;
        case 500:
          statusMessage = "服務器錯誤，請稍後再試。";
          break;
        default:
          statusMessage = `未知錯誤: ${response.status}`;
      }

      if (!response.ok) {
        throw new Error(statusMessage);
      }

      const result = await response.json();
      console.log("Message submission result:", result);
      setMessageStatus("留言提交成功！");

      // 延遲關閉對話框
      setTimeout(() => {
        handleCloseDialog();
      }, 1500);
    } catch (error) {
      console.error("Error submitting message:", error);
      setMessageStatus(`提交失敗: ${error.message}`);
    }
  };

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

                {/* 留言按鈕 - 只有成功領取時才顯示 */}
                {claimStatus === "success" && (
                  <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    startIcon={<MessageIcon />}
                    onClick={handleOpenMessageDialog}
                    sx={{
                      py: 2,
                      fontSize: "1.1rem",
                      borderColor: "#ff9800",
                      color: "#ff9800",
                      "&:hover": {
                        borderColor: "#f57c00",
                        backgroundColor: "rgba(255, 152, 0, 0.04)",
                      },
                    }}
                  >
                    給藝術家留言
                  </Button>
                )}
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
              </Box>
            </Item>

            {/* 額外信息 */}
            <Box textAlign="center" mt={4}>
              <Typography variant="body2" color="text.secondary">
                感謝您使用我們的服務
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Container>

      {/* 留言對話框 */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
          },
        }}
      >
        <DialogTitle>給藝術家留言</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            恭喜您成功領取了 NFT！您想給藝術家或發布者留言嗎？
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="message"
            label="您的留言"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            sx={{ mt: 1 }}
          />
          {messageStatus && (
            <Typography
              variant="body2"
              color={
                messageStatus.includes("成功") ? "success.main" : "error.main"
              }
              sx={{ mt: 1 }}
            >
              {messageStatus}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseDialog} color="primary">
            跳過
          </Button>
          <Button
            onClick={handleSubmitMessage}
            color="primary"
            disabled={!userMessage.trim()}
            variant="contained"
          >
            提交
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}