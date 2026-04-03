import Link from "next/link";
import { useT } from "@/lib/i18n/useT";

import {
  Box,
  CardMedia,
  Stack,
  Skeleton,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";

import Tags from "@/components/Tags";
import { getAkaswapAssetUrl } from "@/lib/stringUtils";
import { getRandomObjectType, getRandomPeriod } from "@/lib/dummy";

import Organizer from "@/components/Organizer";

export default function GeneralTokenCardGrid(props) {
  const t = useT();

  const data = props.data;
  const pageSize = props.pageSize || 6;
  const defaultColumnSettings = {
    grid: {
      xs: 4,
      sm: 8,
      md: 12,
    },
    item: {
      xs: 4,
    },
  };

  const columnSettings = {
    ...defaultColumnSettings,
    grid: {
      ...defaultColumnSettings.grid,
      ...(props.columnSettings?.grid || {}),
    },
    item: {
      ...defaultColumnSettings.item,
      ...(props.columnSettings?.item || {}),
    },
  };

  // TODO: replace dummy data with real data
  if (data) {
    // console.log(data);
    data.forEach((item) => {
      if (!item.objectType) {
        item.objectType = getRandomObjectType();
      }

      if (!item.eventDate) {
        item.eventDate = getRandomPeriod();
      }

      if (!item.tokenImageUrl) {
        item.tokenImageUrl = item.thumbnailUri
          ? getAkaswapAssetUrl(item.thumbnailUri)
          : "https://via.placeholder.com/400";
      }
    });
  }

  const organizers = props.organizers;
  const artists = props.artists;

  return (
    <>
      <Grid container spacing={12} columns={columnSettings.grid} sx={{ my: '2rem' }}>
        {!data &&
          Array.from(new Array(pageSize)).map((_, index) => (
            <Grid xs={columnSettings.item.xs} key={index}>
              <Skeleton variant="rectangular" height={200} sx={{ mb: 1 }} />
              <Skeleton variant="text" />
              <Skeleton variant="text" />
              <Skeleton variant="text" width={100} />
            </Grid>
          ))}
        {data &&
          data.map(
            (
              {
                tokenId,
                contract,
                metadata,
              },
              index
            ) => (
              <Grid
                key={index}
                xs={columnSettings.item.xs}
                sx={{
                  img: {
                    transform: "perspective(1000px) translateY(0px)",
                    transition: "transform 0.3s",
                    "@media (hover: hover)": {
                      "&:hover": {
                        transform: "perspective(1000px) translateZ(100px)",
                      },
                    },
                  },
                }}
              >
                <Box
                  sx={{
                    border: "1px solid var(--brand-secondary)",
                    borderRadius: "10px",
                    p: 3,
                  }}
                >
                  <Link
                    href="/claimsToken/[contract]/[tokenId]"
                    as={`/claimsToken/${contract.address}/${tokenId}`}
                  >
                    <Box
                      sx={{
                        height: 200,
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
                        image={getAkaswapAssetUrl(metadata.thumbnailUri)}
                      />
                    </Box>
                  </Link>

                  <Box id="primary-info" mb={1}>
                    <Typography
                      variant="caption"
                      sx={{ opacity: 0.8, display: "block", lineHeight: 1.2 }}
                    >
                      {t.categoryMap?.[metadata.category] || metadata.category}
                    </Typography>
                    <Typography
                      variant="cardTitle"
                      component="h6"
                      sx={{ fontWeight: 500, mb: 1 }}
                    >
                      {metadata.name}
                    </Typography>
                    <Box>
                      <Link
                        href="/events/[id]"
                        as={`/events/${metadata.projectId}`}
                      >
                        {metadata.projectName}
                      </Link>
                    </Box>

                    <Organizer
                      organizer={metadata.organizer}
                      artists={artists ? artists : null}
                      organizers={organizers ? organizers : null}
                    />
                  </Box>

                  <Stack direction="row" flexWrap="wrap">
                    <Tags tags={metadata.tags} />
                  </Stack>
                </Box>
              </Grid>
            )
          )}
      </Grid>
    </>
  );
}
