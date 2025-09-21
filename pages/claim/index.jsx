import React, { useState, useRef } from "react";
import { useRouter } from "next/router";
import {
  TZKT_API,
  MainnetAPI,
  GetClaimablePoolID,
  postClaimData,
} from "@/lib/api";
import NFTclaim from "@/components/NFTclaim";
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
  const [ownersData, data, data_from_pool] = await Promise.all([
    await MainnetAPI(`/fa2tokens/${targetContract}/${tokenId}`),
    await TZKT_API(`/v1/tokens?contract=${targetContract}&tokenId=${tokenId}`),
    await GetClaimablePoolID(contractAddress, targetContract, tokenId),
  ]);

  return {
    props: { ownersData, data, data_from_pool, nftData },
  };
}

export default function NFTPage({ ownersData, data, data_from_pool, nftData, error }) {
  console.log("============ownersData : ", ownersData);
  console.log("============data : ", data);
  console.log("============data_from_pool : ", data_from_pool);
  console.log("============nftData : ", nftData);
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
      const targetContract = data[0].contract.address;

      localStorage.setItem("userWalletAddress", address);
      localStorage.setItem("claimedTokenId", tokenId);
      localStorage.setItem("claimedContract", targetContract);

      // 根據不同的 claim 結果設置狀態
      if (claimResult.isInvalid) {
        setClaimStatus(`Claim Status: Invalid address or pool`);
        localStorage.setItem("claimStatus", "invalid");
      } else if (!claimResult.isEnrolled && claimResult.isSoldOut) {
        setClaimStatus(`Claim Status: Sold out`);
        localStorage.setItem("claimStatus", "soldOut");
      } else if (!claimResult.isEnrolled && !claimResult.isSoldOut) {
        setClaimStatus(`Claim Status: Already claimed`);
        localStorage.setItem("claimStatus", "alreadyClaimed");
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
      }

      // 無論什麼情況，都跳轉到 claim-success 頁面
      window.location.href = "/claim-success";
    } catch (error) {
      console.error("Error claiming NFT:", error);
      setClaimStatus(`Error claiming NFT: ${error.message}`);
      localStorage.setItem("claimStatus", "error");
      // 即使出錯也跳轉到 claim-success 頁面
      window.location.href = "/claim-success";
    } finally {
      // Logout from Kukai wallet after processing claim result
      if (embedRef.current) {
        await embedRef.current.logout();
        setIsLoggedIn(false);
        console.log("Logged out successfully");
      }
    }
  };

  if (error) {
    return <div>{error}</div>;
  }

  if (!nftData) {
    return <div>Error fetching NFT data.</div>;
  }

  if (data) {
    data = data.map((d) => {
      d.eventPlace = d.metadata.event_location
        ? d.metadata.event_location
        : getRandomPlace();
      d.creator = d.metadata.organizer
        ? d.metadata.organizer
        : getRandomCreator();
      d.start_time = d.metadata.start_time;
      d.end_time = d.metadata.end_time;
      if (data_from_pool) {
        d.poolId = data_from_pool[0].key;
        d.duration = data_from_pool[0].value.duration;
      } else {
        d.poolId = null;
        d.duration = null;
      }
      return d;
    });
  }

  return (
    <div>
      {data &&
        data.map((d, index) => (
          <div key={index}>
            <NFTclaim data={d} ownersData={ownersData} />
          </div>
        ))}
      <KukaiEmbedComponent ref={embedRef} onLoginSuccess={handleClaim} />
      <div style={{ display: "flex", justifyContent: "center", margin: "5px" }}>
        {claimStatus && <div>{claimStatus}</div>}
      </div>
    </div>
  );
}