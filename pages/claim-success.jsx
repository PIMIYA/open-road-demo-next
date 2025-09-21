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
    </Box>
  );
}