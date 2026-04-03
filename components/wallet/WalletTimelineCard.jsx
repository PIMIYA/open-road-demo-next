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
} from "@mui/material";
import Tags from "@/components/Tags";

import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import ButtonSpinner from "@/components/ButtonSpinner";

import Organizer from "@/components/Organizer";
import { useT } from "@/lib/i18n/useT";

const BRAND = "var(--brand-secondary)";

export default function WalletTimelineCard({
  data,
  index,
  addressFromURL,
  myWalletAddress,
  organizers,
  artists,
  autoOpenComment = false,
}) {
  const t = useT();
  const contract = data?.contract?.address;
  const tokenId = data?.tokenId;

  const [messageStatus, setMessageStatus] = useState(false);
  const [openDialog, setOpenDialog] = useState(autoOpenComment);
  const [userMessage, setUserMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitDone, setSubmitDone] = useState(false);

  // Watch message status to update UI
  useEffect(() => {
    if (messageStatus) {
      const addCommentElement = document.getElementById(tokenId + `addComment`);
      if (addCommentElement) addCommentElement.style.display = "none";
      const tokenIdElement = document.getElementById(tokenId + `thisComment`);
      if (tokenIdElement) tokenIdElement.innerHTML = userMessage;
    }
    if (!messageStatus) {
      const addCommentElement = document.getElementById(tokenId + `addComment`);
      if (addCommentElement) addCommentElement.style.display = "block";
      const tokenIdElement = document.getElementById(tokenId + `thisComment`);
      if (tokenIdElement) tokenIdElement.innerHTML = "";
    }
  }, [userMessage, tokenId, messageStatus]);

  const handleClickOpen = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    if (!submitting) setOpenDialog(false);
  };

  const handleSubmitMessage = async () => {
    if (!userMessage.trim()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const response = await fetch("/api/post-comment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tokenID: tokenId,
          walletAddress: myWalletAddress,
          contractAddress: contract,
          message: userMessage,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || `Error ${response.status}`);
      }

      await response.json();
      setMessageStatus(true);
      setSubmitDone(true);
    } catch (error) {
      console.error("Error submitting message:", error);
      setSubmitError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!data) {
    return (
      <Box mb={10}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Box width={{ xs: 100, md: 200 }}>
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

  const tokenImageUrl = `https://assets.akaswap.com/ipfs/${data.metadata.thumbnailUri.replace("ipfs://", "")}`;
  const displayImageUrl = data.metadata.displayUri
    ? `https://assets.akaswap.com/ipfs/${data.metadata.displayUri.replace("ipfs://", "")}`
    : tokenImageUrl;

  return (
    <Box mb={10}>
      <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
        <Box width={200} sx={{ fontWeight: 300 }}>
          <Typography variant="body1" sx={{ fontWeight: 300 }}>{data.cliamDate}</Typography>
          <Typography variant="body1" sx={{ fontWeight: 300 }}>{data.claimTime}</Typography>
          <Typography variant="body2" sx={{ fontWeight: 300 }}>
            {data.metadata.event_location}
          </Typography>
        </Box>
        <Box width="100%">
          <Link
            href="/claimsToken/[contract]/[tokenId]"
            as={`/claimsToken/${contract}/${tokenId}`}
          >
            <CardMedia
              sx={{
                height: 300,
                mb: 1.5,
                backgroundSize: "contain",
                backgroundPosition: "left center",
                backgroundColor: "transparent",
              }}
              image={tokenImageUrl}
            />
          </Link>
          <Box>
            {/* Category — small text above name */}
            {data.metadata.category && (
              <Typography variant="caption" sx={{ opacity: 0.8, display: "block", lineHeight: 1.2 }}>
                {t.categoryMap?.[data.metadata.category] || data.metadata.category}
              </Typography>
            )}
            {/* NFT name — bold */}
            <Typography variant="body1" sx={{ fontWeight: 500, mb: 1 }}>
              {data.metadata.name}
            </Typography>
            {data.metadata.projectName && (
              <Box sx={{ mb: 1 }}>
                <Link
                  href="/events/[id]"
                  as={`/events/${data.metadata.projectId}`}
                >
                  <Typography variant="body2" sx={{ textDecoration: "underline" }}>
                    {data.metadata.projectName}
                  </Typography>
                </Link>
              </Box>
            )}
            <Organizer
              organizer={data.metadata.organizer}
              artists={artists ? artists : null}
              organizers={organizers ? organizers : null}
            />
            {/* Tags — outlined chips below */}
            {data.metadata.tags && data.metadata.tags.length > 0 && (
              <Box sx={{ mt: 1 }}>
                {data.metadata.tags.map((tag, i) => (
                  <Chip key={i} label={tag} variant="outlined" size="small" sx={{ mr: 1, mb: 0.5, cursor: "default" }} />
                ))}
              </Box>
            )}
          </Box>

          {/* COMMENTS */}
          {addressFromURL === myWalletAddress ? (
            <Box mt={3} mb={2} sx={{ color: "text.secondary" }}>
              {data.comment ? (
                <Box>
                  <Typography variant="caption" sx={{ opacity: 0.8, display: "block", lineHeight: 1.2, color: "text.primary" }}>
                    {t.nft.comments}
                  </Typography>
                  <Box dangerouslySetInnerHTML={{ __html: data.comment }}></Box>
                </Box>
              ) : (
                <>
                  <Box id={tokenId + `thisComment`} sx={{ paddingTop: "14px" }}>
                  </Box>
                  <Button
                    id={tokenId + `addComment`}
                    variant="outlined"
                    size="small"
                    onClick={handleClickOpen}
                    sx={{
                      color: BRAND,
                      borderColor: BRAND,
                      fontSize: 11,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      mt: 1,
                      "@media (hover: hover)": {
                        "&:hover": {
                          borderColor: BRAND,
                          backgroundColor: "rgba(237, 80, 36, 0.05)",
                        },
                      },
                    }}
                  >
                    {t.comment.addComment}
                  </Button>
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
          <Dialog
            open={openDialog}
            onClose={handleCloseDialog}
            maxWidth="sm"
            fullWidth
            slotProps={{
              backdrop: {
                sx: {
                  backgroundColor: "rgba(255, 255, 255, 0.3)",
                  backdropFilter: "blur(2px)",
                },
              },
            }}
            PaperProps={{
              sx: {
                bgcolor: "#fff",
                boxShadow: "0 2px 10px rgba(0,0,0,0.18)",
                border: "1px solid",
                borderColor: BRAND,
                borderRadius: "10px",
              },
            }}
          >
            {/* NFT Image in dialog */}
            {displayImageUrl && (
              <Box sx={{ px: 3, pt: 4, textAlign: "center" }}>
                <Box
                  component="img"
                  src={displayImageUrl}
                  alt={data.metadata.name || "NFT"}
                  sx={{
                    width: "100%",
                    maxHeight: 240,
                    objectFit: "contain",
                    display: "block",
                    mx: "auto",
                    borderRadius: 1,
                  }}
                />
              </Box>
            )}

            <DialogTitle sx={{ color: BRAND, fontSize: 14, fontWeight: "bold", pb: 0 }}>
              {data.metadata.name || t.comment.leaveMessage}
            </DialogTitle>

            <DialogContent>
              {submitDone ? (
                /* Success state */
                <>
                  <Typography sx={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", color: "success.main", mt: 1, mb: 0.5 }}>
                    {t.comment.messageSent}
                  </Typography>
                  <Typography sx={{ fontSize: 13, color: "text.primary", whiteSpace: "pre-wrap", mt: 1 }}>
                    {userMessage}
                  </Typography>
                </>
              ) : (
                /* Input state */
                <>
                  <DialogContentText sx={{ fontSize: 12, color: "text.secondary", mb: 1 }}>
                    {t.comment.leaveMessageDesc}
                  </DialogContentText>
                  <TextField
                    autoFocus
                    margin="dense"
                    placeholder={t.comment.placeholder}
                    type="text"
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    value={userMessage}
                    onChange={(e) => setUserMessage(e.target.value)}
                    disabled={submitting}
                    sx={{
                      "& .MuiOutlinedInput-root": {
                        fontSize: 13,
                        "& fieldset": { borderColor: BRAND },
                        "&.Mui-focused fieldset": { borderColor: BRAND },
                      },
                    }}
                  />
                  {submitError && (
                    <Typography variant="caption" color="error.main" sx={{ mt: 1, display: "block" }}>
                      {submitError}
                    </Typography>
                  )}
                </>
              )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 4 }}>
              {submitDone ? (
                <Button
                  variant="outlined"
                  onClick={handleCloseDialog}
                  sx={{
                    color: BRAND,
                    borderColor: BRAND,
                    fontSize: 11,
                    "@media (hover: hover)": {
                      "&:hover": { borderColor: BRAND, backgroundColor: "rgba(237, 80, 36, 0.05)" },
                    },
                  }}
                >
                  {t.common.close}
                </Button>
              ) : (
                <>
                  <Button
                    variant="outlined"
                    onClick={handleCloseDialog}
                    disabled={submitting}
                    sx={{
                      color: BRAND,
                      borderColor: BRAND,
                      fontSize: 11,
                      "@media (hover: hover)": {
                        "&:hover": { borderColor: BRAND, backgroundColor: "rgba(237, 80, 36, 0.05)" },
                      },
                    }}
                  >
                    {t.common.skip}
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={handleSubmitMessage}
                    disabled={!userMessage.trim() || submitting}
                    sx={{
                      color: BRAND,
                      borderColor: BRAND,
                      fontSize: 11,
                      "@media (hover: hover)": {
                        "&:hover": { borderColor: BRAND, backgroundColor: "rgba(237, 80, 36, 0.05)" },
                      },
                    }}
                  >
                    {submitting && <ButtonSpinner color="var(--brand-secondary)" />}
                    {submitting ? t.common.sending : t.common.submit}
                  </Button>
                </>
              )}
            </DialogActions>
          </Dialog>
        </Box>
      </Stack>
    </Box>
  );
}
