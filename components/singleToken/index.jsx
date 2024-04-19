import { Box, Chip, Container, Stack, Typography } from "@mui/material";
import Image from "next/image";
import Tags from "@/components/Tags";
import { truncateAddress } from "@/lib/stringUtils";

export default function SingleToken({data}) {
  if (data) {
    data.creator = '白先勇✕蘇州崑劇院';
    data.objectType = '節目手冊';
    data.eventDate = '2024/05/10 - 2024/05/11';
    data.eventPlace = '台北國家戲劇院';
  }

  const tokenImageUrl = `https://assets.akaswap.com/ipfs/${data.displayUri.replace("ipfs://", "")}`;
  const total = data.amount;
  const collected = Object.values(data.owners).reduce((a, b) => a + b, 0);
  const collectedPercentage = Math.round((collected / total) * 100);

  const ownerAliases = data.ownerAliases;
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
                    position: "relative",
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
                <div>
                  this is for comment
                </div>
              </Box>
              <Box
                sx={{
                  width: { xs: "100%", md: "45%" },
                  height: { xs: "auto", md: "auto" },
                }}
              >
                <Box>
                  <Box mb={2}>
                    <Box width={400} bgcolor="#eee">
                      <Box height={6} width={`$collectedPercentage%`} bgcolor='secondary.main'></Box>
                    </Box>
                    {collected} / {total} collected
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
                    {data.description.split("\n").map((paragraph) => (
                      <Typography paragraph>{paragraph}</Typography>
                    ))}
                  </Box>
                </Box>
              </Box>
            </Stack>
          </Box>
        </Container>
      </Box>
      <Container maxWidth="lg">
        <Box py={6} textAlign='center'>
          <Typography variant='h5' component='div' mb={4}>Collecters</Typography>
          <Box sx={{
            columnCount: {
              sm: 2,
              md: 3,
              lg: 4,
            },
            columnGap: 10,
          }}>
          {ownerAddresses.map((address) => (
            <Stack direction="row" justifyContent='space-between' mx='auto'>
              <Box>{data.ownerAliases[address] || truncateAddress(address)}</Box>
              <Box>{data.owners[address]}</Box>
            </Stack>
          ))}
          </Box>
        </Box>
      </Container>
    </>
  )
}
