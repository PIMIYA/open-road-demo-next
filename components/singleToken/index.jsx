import { useTheme } from "@emotion/react";
import { useRouter } from "next/router";

import Link from "next/link";
import Image from "next/image";
import {
  Box,
  Button,
  Container,
  Stack,
  Paper,
  Typography,
} from "@mui/material";
import { styled } from "@mui/material/styles";
import OpenInNewIcon from "@mui/icons-material/OpenInNew";

import Tags from "@/components/Tags";
import TokenCollectors from "./TokenCollectors";
import TokenClaimedProgress from "./TokenClaimedProgress";
import RenderMedia from "@/components/render-media";

import { formatDateRange, getAkaswapAssetUrl } from "@/lib/stringUtils";
import { encrypt } from "@/lib/dummy";

import Organizer from "@/components/Organizer";
import TokenComments from "./TokenComments";

import { useEffect, useMemo, useState } from "react";

/* stack Item setting */
const Item = styled(Paper)(({ theme }) => ({
  textAlign: "left",
  boxShadow: "none",
}));

export default function SingleToken({
  ownersData,
  data,
  organizers,
  artists,
  comments,
}) {
  const router = useRouter();
  const theme = useTheme();
  const tokenImageUrl = getAkaswapAssetUrl(data.metadata.displayUri);
  const total = ownersData?.amount;
  const collected = ownersData ? Object.keys(ownersData?.owners).length - 2 : 0;
  const ownerAddresses = ownersData ? Object.keys(ownersData?.owners) : 0;

  const url = `${router.query.contract}/${router.query.tokenId}`;
  const hash = encrypt(url);
  const showcaseUrl = `/showcase/${hash}`;
  const isShowcasePageLinkAvailable = true; // TODO: depends on wallet

  const mimeType = data.metadata.formats[0].mimeType;
  const src = data.metadata;
  const poolId = data.poolId;
  const duration = data.duration;
  // console.log(mimeType);
  // console.log(ownersData);

  /* Tab: Collectors and Comments */
  const [value, setValue] = useState(0);
  const handleCollectors = async () => {
    setValue(0);
  };
  const handleComments = async () => {
    setValue(1);
  };

  return (
    <>
      <Box sx={{ background: "#fff" }} mx={3} borderRadius={2}>
        <Container maxWidth="lg">
          <Box py={6}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={8}>
              <Item
                sx={{
                  width: { xs: "100%", md: "55%" },
                  height: { xs: "100%", md: "auto" },
                }}
              >
                <Box
                  sx={{
                    width: { xs: "100%", md: "100%" },
                    height: { xs: "100%", md: "auto" },
                  }}
                >
                  <RenderMedia mimeType={mimeType} src={src} />
                  {/* add poolID for claim page and event time from akadrop  */}
                  {/* <Box
                    sx={{
                      position: "relative",
                      top: 16,
                      right: 16,
                      backgroundColor: "rgba(0, 0, 0, 0.7)",
                      color: "#fff",
                      padding: "4px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    {poolId !== null ? (
                      <>
                        Pool ID: {poolId} <br />
                        end_time: {duration.end_time}
                        <br />
                        start_time: {duration.start_time}
                      </>
                    ) : (
                      "Expired or not able to claim"
                    )}
                  </Box> */}
                  {/*  */}
                </Box>
              </Item>
              <Item
                sx={{
                  width: { xs: "100%", md: "45%" },
                  height: { xs: "100%", md: "auto" },
                }}
              >
                <Box
                  sx={{
                    width: { xs: "100%", md: "100%" },
                    height: { xs: "auto", md: "auto" },
                  }}
                >
                  <Box>
                    <Box mb={2} width={400} maxWidth="100%">
                      {collected !== 0 ? (
                        <TokenClaimedProgress
                          collected={collected}
                          total={total}
                        />
                      ) : (
                        <Typography variant="h6" component="h1">
                          No Owner
                        </Typography>
                      )}
                    </Box>

                    <Typography variant="h4" component="h1">
                      {data.metadata.name}
                    </Typography>
                    <Typography variant="h6" component="div" mb={2} mt={1}>
                      <Link
                        href="/events/[id]"
                        as={`/events/${data.metadata.projectId}`}
                      >
                        {data.metadata.projectName}
                      </Link>
                    </Typography>

                    <Typography variant="h6" component="div" mb={2}>
                      <Organizer
                        organizer={data.creator}
                        artists={artists}
                        organizers={organizers}
                      />
                    </Typography>

                    <Typography variant="body2">
                      {data.metadata.start_time
                        ? formatDateRange(
                            data.metadata.start_time,
                            data.metadata.end_time
                          )
                        : eventDate}
                    </Typography>
                    <Typography mb={2}>{data.eventPlace}</Typography>

                    {data.tags && (
                      <Box mb={8}>
                        <Tags tags={data.tags} />
                      </Box>
                    )}

                    {/* {isShowcasePageLinkAvailable && (
                    <Box mb={3}>
                      <Button variant="outlined" startIcon={<OpenInNewIcon />}>
                        <Link href={showcaseUrl} target="_blank">
                          Showcase Page
                        </Link>
                      </Button>
                    </Box>
                  )} */}

                    <Box>
                      {data.metadata.description
                        .split("\n")
                        .map((paragraph, index) => (
                          <Typography key={index} paragraph>
                            {paragraph}
                          </Typography>
                        ))}
                    </Box>
                  </Box>
                </Box>
              </Item>
            </Stack>
          </Box>
        </Container>
      </Box>

      <Box sx={{ textAlign: "center", paddingTop: 6 }}>
        <Button
          variant={value === 0 ? "contained" : "outlined"}
          size="small"
          onClick={handleCollectors}
          disabled={
            !ownersData ||
            ownersData.owners === null ||
            ownersData.owners.length === 0
          }
          sx={{ mr: 1 }}
        >
          Collectors
        </Button>

        <Button
          variant={value === 1 ? "contained" : "outlined"}
          size="small"
          onClick={handleComments}
          disabled={
            !comments || comments.data === null || comments.data.length === 0
          }
          sx={{ ml: 1 }}
        >
          Comments
        </Button>
      </Box>
      <Box sx={{ display: value === 0 ? "block" : "none" }}>
        {ownerAddresses === 0 ? null : (
          <TokenCollectors
            owners={ownersData.owners}
            ownerAddresses={ownerAddresses}
            ownerAliases={ownersData.ownerAliases}
          />
        )}
      </Box>
      <Box sx={{ display: value === 1 ? "block" : "none" }}>
        {ownerAddresses === 0 ? null : (
          <TokenComments
            owners={ownersData.owners}
            ownerAddresses={ownerAddresses}
            ownerAliases={ownersData.ownerAliases}
            comments={comments}
          />
        )}
      </Box>
    </>
  );
}
