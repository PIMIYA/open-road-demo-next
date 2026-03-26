import React, { useState, useRef } from "react";
import { Box, Container, Typography } from "@mui/material";
import {
  TZKT_API,
  GetClaimablePoolID,
} from "@/lib/api";
import { getAkaswapAssetUrl } from "@/lib/stringUtils";
import KukaiEmbedComponent from "../../components/KukaiEmbedComponent";

const contractAddress = "KT1GyHsoewbUGk4wpAVZFUYpP2VjZPqo1qBf";
const AkaDropAPI = "https://mars.akaswap.com/drop/api/pools";

async function getNFTData(contract, poolId) {
  const url = `${AkaDropAPI}/${contract}/${poolId}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching NFT data:", error);
    return null;
  }
}

export async function getServerSideProps(context) {
  const { poolID } = context.query;

  // Fetch NFT data from AkaDropAPI
  const nftData = await getNFTData(contractAddress, poolID);

  if (!nftData) {
    return {
      props: { error: "Error fetching NFT data" },
    };
  }

  // Extract targetContract and tokenId from uid
  const [targetContract, tokenId] = nftData.tokens[0].uid.split("-");

  // Fetch additional information using targetContract and tokenId
  const [data, data_from_pool] = await Promise.all([
    TZKT_API(`/v1/tokens?contract=${targetContract}&tokenId=${tokenId}`),
    GetClaimablePoolID(contractAddress, targetContract, tokenId),
  ]);

  return {
    props: { data, data_from_pool, nftData },
  };
}

export default function NFTPage({ data, data_from_pool, nftData, error }) {
  const [claimStatus, setClaimStatus] = useState("");
  const embedRef = useRef(null);

  const handleClaim = async (userInfo) => {
    const {
      pkh: address,
      userData: { email },
    } = userInfo;

    console.log(`address is : ${address}`);
    console.log(`email is : ${email}`);

    if (!address || !email) {
      setClaimStatus("Wallet not connected or email not available.");
      return;
    }

    try {
      // Lookup Wallet Address by Gmail
      const lookupResponse = await fetch(`/api/lookup?email=${email}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!lookupResponse.ok) {
        throw new Error(
          `HTTP error during lookup! status: ${lookupResponse.status}`
        );
      }

      const lookupResult = await lookupResponse.json();
      const lookup_address = lookupResult.address;

      if (lookupResult.isInvalid) {
        setClaimStatus("Invalid address.");
        return;
      }

      // Claim NFT
      const claimData = {
        contract: contractAddress,
        poolId: parseInt(data_from_pool[0].key, 10),
        email: email,
        address: address,
      };

      console.log("Sending claim data:", claimData);

      const claimResponse = await fetch(`/api/claim`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(claimData),
      });

      if (!claimResponse.ok) {
        const errorData = await claimResponse.json();
        console.log("Claim error response:", errorData);
        throw new Error(
          `HTTP error during claim! status: ${claimResponse.status}, message: ${errorData.message}`
        );
      }

      const claimResult = await claimResponse.json();
      console.log("Claim result:", claimResult);

      // 存儲基本信息
      const tokenId = data[0].tokenId.toString();
      const targetContract = data[0].contract.address || data[0].contract;

      localStorage.setItem("userWalletAddress", address);
      localStorage.setItem("claimedTokenId", tokenId);
      localStorage.setItem("claimedContract", targetContract);
      localStorage.setItem("userEmail", email);
      localStorage.setItem("nftName", data[0].metadata?.name || "NFT");
      localStorage.setItem(
        "nftDescription",
        data[0].metadata?.description || ""
      );
      localStorage.setItem("nftImageUrl", data[0].metadata?.displayUri || "");

      // 根據不同的 claim 結果設置狀態
      if (claimResult.isInvalid) {
        setClaimStatus(`無法領取，該活動可能已結束，或此地址已領取過。`);
        localStorage.setItem("claimStatus", "invalid");
        // 不跳轉，顯示錯誤信息
      } else if (!claimResult.isEnrolled && claimResult.isSoldOut) {
        setClaimStatus(`Claim Status: Sold out`);
        localStorage.setItem("claimStatus", "soldOut");
        // 不跳轉，顯示錯誤信息
      } else if (!claimResult.isEnrolled && !claimResult.isSoldOut) {
        setClaimStatus(`Claim Status: Already claimed`);
        localStorage.setItem("claimStatus", "alreadyClaimed");
        // 已領取過，跳轉到成功頁面
        console.log("🚀 Redirecting to claim-success page (already claimed)");
        window.location.href = "/claim-success";
      } else if (claimResult.isEnrolled && !claimResult.isSoldOut) {
        setClaimStatus(`Claim successful`);
        localStorage.setItem("claimStatus", "success");

        // 只有成功領取時才嘗試添加到數據庫
        try {
          const addUserWalletResponse = await fetch(`/api/addUserWallet`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              email: email,
              address: address,
              poolID: data_from_pool[0].key,
            }),
          });

          if (!addUserWalletResponse.ok) {
            console.error("addUserWallet failed, but NFT claim was successful");
          } else {
            const addUserWalletResult = await addUserWalletResponse.json();
            console.log("addUserWalletResult:", addUserWalletResult);
          }
        } catch (error) {
          console.error("addUserWallet error:", error);
        }

        // 成功領取，跳轉到成功頁面
        console.log("🚀 Redirecting to claim-success page (success)");
        window.location.href = "/claim-success";
      }
    } catch (error) {
      console.error("Error claiming NFT:", error);
      setClaimStatus(`Error claiming NFT: ${error.message}`);
      localStorage.setItem("claimStatus", "error");
      // 不跳轉，顯示錯誤信息
    } finally {
      // Logout from Kukai wallet after processing claim result
      if (embedRef.current) {
        await embedRef.current.logout();
        console.log("Logged out successfully");
      }
    }
  };

  if (error) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="overline" color="error.main">{error}</Typography>
      </Container>
    );
  }

  if (!nftData) {
    return (
      <Container maxWidth="sm" sx={{ py: 10, textAlign: "center" }}>
        <Typography variant="overline" color="error.main">ERROR FETCHING NFT DATA</Typography>
      </Container>
    );
  }

  const poolId = data_from_pool?.[0]?.key ?? null;
  const coverUri = nftData?.coverUri;
  const imageUrl = coverUri ? getAkaswapAssetUrl(coverUri) : null;
  const name = nftData?.name || "";

  return (
    <Container maxWidth="sm" sx={{ py: 6, textAlign: "center" }}>
      {/* Display image */}
      {imageUrl && (
        <Box sx={{ mb: 4 }}>
          <Box
            component="img"
            src={imageUrl}
            alt={name}
            sx={{ width: "100%", maxWidth: 480, borderRadius: 2 }}
          />
        </Box>
      )}

      {/* NFT name */}
      <Typography variant="h5" component="h1" sx={{ mb: 4 }}>
        {name}
      </Typography>

      {/* Claim button */}
      {poolId !== null ? (
        <KukaiEmbedComponent ref={embedRef} onLoginSuccess={handleClaim} />
      ) : (
        <Typography variant="caption" color="warning.main">
          EXPIRED OR NOT ABLE TO CLAIM
        </Typography>
      )}

      {claimStatus && (
        <Box sx={{ mt: 3, border: 1, borderColor: "warning.main", p: 3 }}>
          <Typography variant="caption" color="warning.main">{claimStatus}</Typography>
        </Box>
      )}
    </Container>
  );
}