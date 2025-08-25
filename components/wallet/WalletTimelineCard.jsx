import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Box,
  Stack,
  Skeleton,
  Typography,
  Chip,
  CardMedia,
  Input,
} from "@mui/material";
import Tags from "@/components/Tags";

// Add these imports for the dialog
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";

import Organizer from "@/components/Organizer";

export default function WalletTimelineCard({
  data,
  index,
  addressFromURL,
  myWalletAddress,
  organizers,
  artists,
}) {
  // const { contract, tokenId } = data;
  const contract = data.contract.address;
  const tokenId = data.tokenId;

  const [messageStatus, setMessageStatus] = useState(false);
  // Add states for the dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [userMessage, setUserMessage] = useState("");
  const [tokenID, setTokenID] = useState("");
  const [userAddress, setUserAddress] = useState("");

  // Keep watching the message status, if the message is sent successfully, then hide .addComment and display the userMessage to the #tokenId
  useEffect(() => {
    if (messageStatus) {
      const addCommentElement = document.getElementById(tokenId + `addComment`);
      if (addCommentElement) {
        addCommentElement.style.display = "none";
      }
      const tokenIdElement = document.getElementById(tokenId + `thisComment`);
      if (tokenIdElement) {
        tokenIdElement.innerHTML = userMessage;
      }
    }
    if (!messageStatus) {
      const addCommentElement = document.getElementById(tokenId + `addComment`);
      if (addCommentElement) {
        addCommentElement.style.display = "block";
      }
      const tokenIdElement = document.getElementById(tokenId + `thisComment`);
      if (tokenIdElement) {
        tokenIdElement.innerHTML = "";
      }
    }
  }, [userMessage, tokenId, messageStatus]);

  // Handle dialog open
  const handleClickOpen = () => {
    setOpenDialog(true);
  };
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
          tokenID: tokenId,
          walletAddress: myWalletAddress,
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
      setMessageStatus(true);
    } catch (error) {
      console.error("Error submitting message:", error);
      setMessageStatus(false);
      // setClaimStatus((prevStatus) => prevStatus + " • Error: " + error.message);
    } finally {
      setOpenDialog(false);
    }
  };
  if (!data) {
    return (
      <Box mb={10}>
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          spacing={2}
        >
          <Box
            width={{
              xs: 100,
              md: 200,
            }}
          >
            <Skeleton width="50%" />
            <Skeleton />
          </Box>
          <Box width="100%">
            <Skeleton variant="rectangular" width="100%" height={300} />
            <Box mt={1}>
              <Skeleton width="30%" />
              <Skeleton width="20%" />
            </Box>
          </Box>
        </Stack>
      </Box>
    );
  }
  const tokenImageUrl = `https://assets.akaswap.com/ipfs/${data.metadata.thumbnailUri.replace(
    "ipfs://",
    ""
  )}`;

  return (
    <Box mb={10}>
      <Stack
        direction={{
          xs: "column",
          md: "row",
        }}
        spacing={2}
      >
        <Box width={200}>
          <Typography variant="body1">{data.cliamDate}</Typography>
          <Typography variant="body1">{data.claimTime}</Typography>
          <Typography variant="body2">
            {data.metadata.event_location}
          </Typography>
        </Box>
        <Box width={"100%"}>
          <Box
            sx={{
              width: {
                md: "100%",
                lg: "30vw",
              },
              maxWidth: "400px",
            }}
          >
            <Link
              href={{
                pathname: `/claimsToken/[contract]/[tokenId]`,
                query: { contract, tokenId },
              }}
            >
              <Box
                sx={{
                  bgcolor: "white",
                  height: 400,
                  padding: 3,
                  mb: 1.5,
                }}
              >
                <CardMedia
                  component="img"
                  alt="thumbnail"
                  sx={{
                    objectFit: "contain",
                    height: "100%",
                    width: "100%",
                    margin: "auto",
                  }}
                  image={tokenImageUrl}
                />
              </Box>
            </Link>
          </Box>
          <Box mt={1} mb={2}>
            <Typography variant="h6">
              <Link
                href={{
                  pathname: `/claimsToken/[contract]/[tokenId]`,
                  query: { contract, tokenId },
                }}
              >
                {data.metadata.name}
              </Link>
            </Typography>
            <Box>
              <Link
                href="/events/[id]"
                as={`/events/${data.metadata.projectId}`}
              >
                {data.metadata.projectName}
              </Link>
            </Box>
            <Organizer
              organizer={data.metadata.organizer}
              artists={artists ? artists : null}
              organizers={organizers ? organizers : null}
            />
            {/* <Typography variant="body1">{data.metadata.organizer}</Typography> */}
          </Box>
          {/* <Tags tags={data.token.metadata.tags} /> */}
          <Chip label={data.metadata.category} size="small" />
          {/* COMMENTS */}
          {addressFromURL === myWalletAddress ? (
            <Box mt={1} mb={2} sx={{ color: "text.secondary" }}>
              {data.comment ? (
                <Box dangerouslySetInnerHTML={{ __html: data.comment }}></Box>
              ) : (
                <>
                  <Box
                    id={tokenId + `thisComment`}
                    sx={{ paddingTop: "14px" }}
                  ></Box>
                  <Input
                    id={tokenId + `addComment`}
                    placeholder="Add a comment"
                    onClick={handleClickOpen}
                  />
                </>
              )}
            </Box>
          ) : (
            <Box mt={1} mb={2} sx={{ color: "text.secondary" }}>
              {data.comment && (
                <Box dangerouslySetInnerHTML={{ __html: data.comment }}></Box>
              )}
            </Box>
          )}

          {/* Message Dialog */}
          <Dialog open={openDialog} onClose={handleCloseDialog}>
            <DialogTitle>Leave a Message</DialogTitle>
            <DialogContent>
              <DialogContentText>
                Congratulations on your successful claim! Would you like to
                leave a message for Artist or Publisher?
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
        </Box>
      </Stack>
    </Box>
  );
}
