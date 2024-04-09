/* MUI */
import { styled } from "@mui/material/styles";
import { Box, Skeleton, Typography } from "@mui/material";
import { CardMedia } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';

/* NEXT */
import Link from "next/link";

/* Style Grid Item */
const Item = styled(Box)(({ theme }) => ({
  background: "transparent",
  "& a": {
    textDecoration: "none",
    color: "inherit",
  }
}));

export default function SelectedTokenCardGrid({ data }) {
  return (
    <>
      <Grid container spacing={4} columns={{ xs: 4, sm: 8, md: 12 }}>
        {!data &&
          Array.from(new Array(6)).map(
            (_, index) => (
              <Grid xs={4}>
                  <Skeleton variant="rectangular" height={200} sx={{mb: 1}} />
                  <Skeleton variant="text" />
                  <Skeleton variant="text" />
                  <Skeleton variant="text" width={100} />
              </Grid>
        ))}
        {data &&
          data.map(
            ({
              tokenId,
              name,
              amount,
              creators,
              thumbnailUri,
              tags,
              contract,
            }) => (
              <Grid key={tokenId} xs={4}>
                <Item>
                  <Link
                    href="/event/[contract]/[tokenId]"
                    as={`/event/${contract}/${tokenId}`}
                  >
                    <CardMedia
                      component="img"
                      alt="thumbnail"
                      height="230"
                      sx={{
                        mb: 1,
                      }}
                      image={`https://assets.akaswap.com/ipfs/${thumbnailUri.replace(
                        "ipfs://",
                        ""
                      )}`}
                    />

                    <Typography variant="cardTitle" component="h6" gutterBottom>
                      {name}
                    </Typography>
                    <Typography variant="body2">
                      Edition of {amount}
                    </Typography>
                    <Box>
                      {/* <Box>
                          {creators &&
                            creators.map((creator, index) => (
                              <Box key={index} ml={0}>
                                {creator}
                              </Box>
                            ))}
                        </Box> */}
                      <Typography
                        variant="body2"
                        noWrap={true}
                      >
                        {creators[0]}
                      </Typography>
                    </Box>
                  </Link>
                </Item>
              </Grid>
            )
          )}
      </Grid>
    </>
  );
}
