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

export default function WalletTimelineCard({ data, index }) {
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
  // const { contract, tokenId } = data;
  const contract = data.contract.address;
  const tokenId = data.tokenId;

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
            <Typography variant="body1">{data.metadata.organizer}</Typography>
          </Box>
          {/* <Tags tags={data.token.metadata.tags} /> */}
          <Chip label={data.metadata.category} size="small" />
        </Box>
      </Stack>
    </Box>
  );
}
