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

import { getAkaswapAssetUrl } from "@/lib/stringUtils";
import { encrypt } from "@/lib/dummy";

/* stack Item setting */
const Item = styled(Paper)(({ theme }) => ({
  textAlign: "left",
  boxShadow: "none",
}));

export default function SingleToken({ ownersData, data }) {
  const router = useRouter();
  const theme = useTheme();
  const tokenImageUrl = getAkaswapAssetUrl(data.metadata.displayUri);
  const total = ownersData.amount;
  const collected = ownersData ? Object.keys(ownersData.owners).length - 2 : 0;
  const ownerAddresses = ownersData ? Object.keys(ownersData.owners) : 0;

  const url = `${router.query.contract}/${router.query.tokenId}`;
  const hash = encrypt(url);
  const showcaseUrl = `/showcase/${hash}`;
  const isShowcasePageLinkAvailable = true; // TODO: depends on wallet

  const mimeType = data.metadata.formats[0].mimeType;
  const src = data.metadata;
  const poolId = data.poolId;
  const duration = data.duration;
  // console.log(mimeType);
  // console.log(duration);

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
                    <Typography variant="h6" component="div" mb={2}>
                      {data.creator}
                    </Typography>

                    <Typography variant="body2">
                      {data.start_time
                        ? new Date(data.start_time).toLocaleDateString() +
                          " - " +
                          new Date(data.end_time).toLocaleDateString()
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
      {ownerAddresses === 0 ? null : (
        <TokenCollectors
          owners={ownersData.owners}
          ownerAddresses={ownerAddresses}
          ownerAliases={ownersData.ownerAliases}
        />
      )}
    </>
  );
}
