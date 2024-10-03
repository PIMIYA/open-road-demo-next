import React, { useState, useEffect } from 'react';
import { TZKT_API, MainnetAPI, GetClaimablePoolID } from "@/lib/api";
import SingleToken from "@/components/singleToken";
import { useConnection } from '@/packages/providers';

const contractAddress = "KT1GyHsoewbUGk4wpAVZFUYpP2VjZPqo1qBf";
const AkaDropAPI = "https://mars.akaswap.com/drop/api/pools";
const partnerId = "your-partner-id"; // Replace with partner ID

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
      props: { error: 'Error fetching NFT data' },
    };
  }

  // Extract targetContract and tokenId from uid
  const [targetContract, tokenId] = nftData.tokens[0].uid.split('-');

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
  const { address, connect, disconnect } = useConnection();
  const [email, setEmail] = useState(null);
  const [claimStatus, setClaimStatus] = useState(null);

  useEffect(() => {
    if (address) {
      //  still need  to get email from Kukai wallet
      //dont know how to get email from Kukai wallet yet???
    }
  }, [address]);

  const handleClaim = async () => {
    if (!address || !email) {
      setClaimStatus("Wallet not connected or email not available.");
      return;
    }

    const claimData = {
      contract: contractAddress,
      poolId: data_from_pool[0].key,
      email: email,
      address: address,
    };

    const auth = btoa('your-username:your-password'); // Replace with your actual username and password

    try {
      const response = await fetch(`https://mars.akaswap.com/drop/api/partners/${partnerId}/claims`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`,
        },
        body: JSON.stringify(claimData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setClaimStatus(`Claim successful: ${JSON.stringify(result)}`);
    } catch (error) {
      console.error("Error claiming NFT:", error);
      setClaimStatus(`Error claiming NFT: ${error.message}`);
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
      if(data_from_pool){
        d.poolId = data_from_pool[0].key;
        d.duration = data_from_pool[0].value.duration;
      }else{
        d.poolId = null;
        d.duration = null;
      }

      return d;
    });
  }

  return (
    <div>
      <div>
        {address ? (
          <div>
            <p>Wallet is connected</p>
            <p>Address: {address}</p>
            {email && <p>Email: {email}</p>}
            <button onClick={handleClaim}>Claim NFT</button>
            {claimStatus && <p>{claimStatus}</p>}
          </div>
        ) : (
          <div>
            <p>Wallet is not connected</p>
          </div>
        )}
      </div>
      {data && data.map((d, index) => (
        <div key={index}>
          <SingleToken data={d} ownersData={ownersData} />
        </div>
      ))}
    </div>
  );
}