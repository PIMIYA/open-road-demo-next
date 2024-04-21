import { Box, Container, Stack, Typography } from "@mui/material";
import Image from "next/image";
import Tags from "@/components/Tags";

import TokenCollectors from "./TokenCollectors";
import TokenClaimedProgress from "./TokenClaimedProgress";
import { useTheme } from "@emotion/react";

export default function SingleToken({data}) {
  const theme = useTheme();
  const tokenImageUrl = `https://assets.akaswap.com/ipfs/${data.displayUri.replace("ipfs://", "")}`;
  const total = data.amount;
  const collected = Object.values(data.owners).reduce((a, b) => a + b, 0);
  const ownerAddresses = Object.keys(data.owners);

  return (
    <>
      <Box sx={{ background: '#fff' }}>
        <Container maxWidth="lg">
          <Box py={6}>
            <Stack direction={{ xs: "column", md: "row" }} spacing={8}>
              <Box
                sx={{
                  width: { xs: "100%", md: "55%" },
                  height: { xs: "100%", md: "auto" },
                }}
              >
                <Box
                  sx={{
                    width: { xs: "100%", md: "100%" },
                    height: { xs: "100vw", md: "70vh" },
                    position: "sticky",
                    top: theme.spacing(6),
                  }}
                >
                  <Image
                    priority={true}
                    src={tokenImageUrl}
                    fill
                    style={{
                      objectFit: "contain", // cover, contain, none
                      objectPosition: "top",
                    }}
                    alt="Picture of the author"
                  />
                </Box>
              </Box>
              <Box
                sx={{
                  width: { xs: "100%", md: "45%" },
                  height: { xs: "auto", md: "auto" },
                }}
              >
                <Box>
                  <Box mb={2} width={400} maxWidth="100%">
                    <TokenClaimedProgress collected={collected} total={total} />
                  </Box>

                  <Typography variant="h4" component="h1">
                    {data.name}
                  </Typography>
                  <Typography variant="h6" component="div" mb={2}>
                    {data.creator}
                  </Typography>

                  <Typography>
                    {data.eventDate}
                  </Typography>
                  <Typography mb={2}>
                    {data.eventPlace}
                  </Typography>

                  {data.tags &&
                    <Box mb={8}>
                      <Tags tags={data.tags} />
                    </Box>
                  }

                  <Box>
                    {data.description.split("\n").map((paragraph, index) => (
                      <Typography key={index} paragraph>{paragraph}</Typography>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Stack>
          </Box>
        </Container>
      </Box>
      <TokenCollectors owners={data.owners} ownerAddresses={ownerAddresses} ownerAliases={data.ownerAliases} />
    </>
  )
}
