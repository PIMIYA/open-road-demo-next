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
import TokenCollectors from "../singleToken/TokenCollectors";
import TokenClaimedProgress from "../singleToken/TokenClaimedProgress";
import RenderMedia from "@/components/render-media";

import { getAkaswapAssetUrl } from "@/lib/stringUtils";
import { encrypt } from "@/lib/dummy";

/* stack Item setting */
const Item = styled(Paper)(({ theme }) => ({
  textAlign: "left",
  boxShadow: "none",
}));

export default function NFTclaim({ ownersData, data }) {
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
            <Stack direction="column" spacing={8}>
              <Item
                sx={{
                  width: "100%",
                  height: "auto",
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    height: "auto",
                  }}
                >
                  <RenderMedia mimeType={mimeType} src={src} />
                </Box>
              </Item>
              <Item
                sx={{
                  width: "100%",
                  height: "auto",
                }}
              >
                <Box
                  sx={{
                    width: "100%",
                    height: "auto",
                  }}
                >
                  <Box>
                    <Box mb={2} width="100%">
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

                    <Box>
                      {data.metadata.description
                        .split("\n")
                        .map((paragraph, index) => (
                          <Typography key={index} paragraph>
                            {paragraph}
                          </Typography>
                        ))}
                    </Box>

                    {/* add poolID for claim page and event time from akadrop  */}
                    <Box
                      sx={{
                        color: "#000",
                        padding: "16px",
                        borderRadius: "8px",
                        marginBottom: "16px",
                      }}
                    >
                      {poolId !== null ? (
                        <>
                          <Typography variant="h6">
                            {/* Pool ID: {poolId} */}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <Typography variant="body2">
                              Start Time: {duration.start_time}
                            </Typography>
                            <Typography variant="body2">
                              End Time: {duration.end_time}
                            </Typography>
                          </Box>
                        </>
                      ) : (
                        <Typography variant="body2">
                          Expired or not able to claim
                        </Typography>
                      )}
                    </Box>
                    {/*  */}
                  </Box>
                </Box>
              </Item>
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* {ownerAddresses === 0 ? null : (
        <TokenCollectors
          owners={ownersData.owners}
          ownerAddresses={ownerAddresses}
          ownerAliases={ownersData.ownerAliases}
        />
      )} */}
    </>
  );
}
