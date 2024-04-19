/* MUI */
import { styled } from "@mui/material/styles";
import { Box, Chip, CardMedia, Stack, Skeleton, Typography } from "@mui/material";
import Grid from '@mui/material/Unstable_Grid2';
import Tags from "@/components/Tags";

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

  // TODO: replace dummy data with real data
  if (data) {
    data.forEach((item) => {
      item.creator = '白先勇✕蘇州崑劇院';
      item.objectType = '節目手冊';
      item.eventDate = '2024/05/10 - 2024/05/11';
      item.eventPlace = '台北國家戲劇院';
    });
  }

  return (
    <>
      <Grid container spacing={4} columns={{ xs: 4, sm: 8, md: 12 }}>
        {!data &&
          Array.from(new Array(6)).map(
            (_, index) => (
              <Grid xs={4} key={index}>
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
              creator,
              creators,
              thumbnailUri,
              tags,
              contract,
              objectType,
              eventDate,
              eventPlace,
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
                    <Box id="primary-info" mb={1}>
                      <Stack direction="row" spacing={1}>
                        <Typography variant="cardTitle" component="h6" gutterBottom>
                          {name}
                        </Typography>
                        <Chip label={objectType} size="small" />
                      </Stack>
                      <Typography variant="body1">
                        {creator}
                      </Typography>
                    </Box>
                    <Box id="secondary-info" mb={2}>
                      <Typography variant="body2">
                        {eventDate}
                      </Typography>
                      <Typography variant="body2">
                        {eventPlace}
                      </Typography>
                    </Box>
                    <Stack direction="row" flexWrap="wrap">
                      <Tags tags={tags.slice(0, 5)} />
                    </Stack>
                  </Link>
                </Item>
              </Grid>
            )
          )}
      </Grid>
    </>
  );
}
