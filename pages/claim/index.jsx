import React, { useState, useRef } from "react";
import {
  TZKT_API,
  MainnetAPI,
  GetClaimablePoolID,
  postClaimData,
} from "@/lib/api";
import NFTclaim from "@/components/NFTclaim";
import KukaiEmbedComponent from "../../components/KukaiEmbedComponent";

// Add these imports for the dialog
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

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

  // Add states for the dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const [tokenID, setTokenID] = useState("");
  const [userAddress, setUserAddress] = useState("");

  // Handle dialog close
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  // Handle message submission
  const handleSubmitMessage = async () => {
    try {
      const response = await fetch("/api/post-comment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tokenID: tokenID,
          walletAddress: userAddress,
          message: userMessage,
        }),
      });

      // Handle different status codes
      let statusMessage = "";

      switch (response.status) {
        case 200:
          statusMessage = "200 OK: The message was received successfully.";
          break;
        case 201:
          statusMessage = "201 Created: Your message was successfully created.";
          break;
        case 400:
          statusMessage =
            "400 Bad Request: Invalid message format or missing required information.";
          break;
        case 403:
          statusMessage =
            "403 Forbidden: You don't have permission to leave a message.";
          break;
        case 500:
          statusMessage =
            "500 Internal Server Error: An error occurred on the server.";
          break;
        default:
          statusMessage = `Unexpected status code: ${response.status}`;
      }

      if (!response.ok) {
        throw new Error(`${statusMessage}`);
      }

      const result = await response.json();
      console.log("Message submission result:", result);
      setClaimStatus((prevStatus) => prevStatus + " • " + statusMessage);
    } catch (error) {
      console.error("Error submitting message:", error);
      setClaimStatus((prevStatus) => prevStatus + " • Error: " + error.message);
    } finally {
      setOpenDialog(false);
    }
  };

  //add test for dry testing comment dialogbox
  // Add this function to your component
  // const openTestDialog = () => {
  //   // Set sample values for testing
  //   setTokenID("123");
  //   setUserAddress("tz1testAddress123456789");
  //   setOpenDialog(true);
  // };

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
        setClaimStatus(`Claim failed: Invalid address or pool`);
      } else if (!claimResult.isEnrolled && claimResult.isSoldOut) {
        setClaimStatus(`Claim failed: Sold out`);
      } else if (!claimResult.isEnrolled && !claimResult.isSoldOut) {
        setClaimStatus(`Claim failed: Already claimed`);
      } else if (claimResult.isEnrolled && !claimResult.isSoldOut) {
        setClaimStatus(`Claim successful: ${JSON.stringify(claimResult)}`);

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

        // lauch dialog to let user able to leave the one time message
        setTokenID(data[0].tokenId.toString());
        setUserAddress(address);
        setOpenDialog(true);
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
      {/* Test button - remove this in production */}
      {/* <div style={{ margin: "20px 0", textAlign: "center" }}>
        <Button
          variant="contained"
          color="secondary"
          onClick={openTestDialog}
          style={{ marginBottom: "20px" }}
        >
          Test Message Dialog
        </Button>
      </div> */}

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
      {/* Message Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Leave a Message</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Congratulations on your successful claim! Would you like to leave a
            message for Artist or Publisher?
          </DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="message"
            label="Your Message"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Skip
          </Button>
          <Button
            onClick={handleSubmitMessage}
            color="primary"
            disabled={!userMessage.trim()}
          >
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}
