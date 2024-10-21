import React, { useState, useRef } from "react";
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

export default function NFTPage({
  ownersData,
  data,
  data_from_pool,
  nftData,
  error,
}) {
  const [claimStatus, setClaimStatus] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const embedRef = useRef(null);

  const handleClaim = async (userInfo) => {
    const {
      pkh: address,
      userData: { email },
    } = userInfo;
    // console.log(`userInfo is : ${JSON.stringify(userInfo)}`);
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
      // console.log(`lookupResult wallet address is : ${lookupResult.address}`);

      if (lookupResult.isInvalid) {
        setClaimStatus("Invalid address.");
        return;
      }

      //check if the wallet address from kukai is the same as the one from the lookup
      //uncomment the following line to enable the check when switch to mainnet
      // if (lookupResult.address !== address) {
      //   setClaimStatus("addressess do not match.");
      //   return;
      // }

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

      console.log("Claim response status:", claimResponse.status);
      console.log(
        "Claim response headers:",
        JSON.stringify([...claimResponse.headers])
      );

      if (!claimResponse.ok) {
        const errorData = await claimResponse.json();
        console.log("Claim error response:", errorData);
        throw new Error(
          `HTTP error during claim! status: ${claimResponse.status}, message: ${errorData.message}`
        );
      }

      const claimResult = await claimResponse.json();
      console.log("Claim result:", claimResult);

      if (claimResult.isInvalid) {
        setClaimStatus(`Claim Status: Invalid address or pool`);
      } else if (!claimResult.isEnrolled && claimResult.isSoldOut) {
        setClaimStatus(`Claim Status: Sold out`);
      } else if (!claimResult.isEnrolled && !claimResult.isSoldOut) {
        setClaimStatus(`Claim Status: Already claimed`);
      } else if (claimResult.isEnrolled && !claimResult.isSoldOut) {
        console.log(`Claim successful: ${JSON.stringify(claimResult)}`);
        setClaimStatus(`Claim successful`);

        // Add user wallet to the database
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
          throw new Error(
            `HTTP error during checkWalletExist! status: ${addUserWalletResponse.status}`
          );
        }

        const addUserWalletResult = await addUserWalletResponse.json();
        console.log("addUserWalletResult:", addUserWalletResult);

      }

      
    } catch (error) {
      console.error("Error claiming NFT:", error);
      setClaimStatus(`Error claiming NFT: ${error.message}`);
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
