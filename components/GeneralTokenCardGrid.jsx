import Link from "next/link";
import { useRouter } from "next/router";

import {
  Box,
  Chip,
  CardMedia,
  Stack,
  Skeleton,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";

import Tags from "@/components/Tags";
import { getAkaswapAssetUrl } from "@/lib/stringUtils";
import { getRandomObjectType, getRandomPeriod } from "@/lib/dummy";
import FadeOnScroll from "./fadeOnScroll";

import Organizer from "@/components/Organizer";

export default function GeneralTokenCardGrid(props) {
  const router = useRouter();

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
      // console.log(item.contract.address);
      // item.start_time = item.start_time ? new Date(item.start_time) : "";
    });
  }

  const organizers = props.organizers;
  const artists = props.artists;
  const projects = props.projects;

  /* Add project name to each item if event_location matches a project's location */
  if (data && projects) {
    data.forEach((item) => {
      const project = projects.data.find(
        (p) =>
          p.location === item.metadata.event_location &&
          p.status === "published"
      );
      if (project) {
        item.project = project.name;
        item.projectId = project.id;
      }
    });
  }

  return (
    <>
      <Grid container spacing={4} columns={columnSettings.grid}>
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
                name,
                creator,
                tokenImageUrl,
                tags,
                contract,
                objectType,
                eventDate,
                eventPlace,
                start_time,
                end_time,
                metadata,
                poolID,
                project,
                projectId,
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
                    "&:hover": {
                      transform: "perspective(1000px) translateZ(100px)",
                    },
                  },
                }}
              >
                <Box>
                  <Link
                    href="/claimsToken/[contract]/[tokenId]"
                    as={`/claimsToken/${contract.address}/${tokenId}`}
                  >
                    <Box
                      sx={{
                        bgcolor: "white",
                        height: 200,
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
                        image={getAkaswapAssetUrl(metadata.thumbnailUri)}
                      />
                    </Box>
                  </Link>

                  <Box id="primary-info" mb={1}>
                    <Stack direction="row" spacing={1}>
                      <Typography
                        variant="cardTitle"
                        component="h6"
                        gutterBottom
                      >
                        {metadata.name}
                      </Typography>
                      <Chip
                        label={metadata.category}
                        size="small"
                        onClick={() => {
                          router.push({
                            pathname: "/events",
                            query: { cat: metadata.category },
                          });
                        }}
                      />
                    </Stack>
                    <Box>
                      <Link href="/project/[id]" as={`/project/${projectId}`}>
                        {project}
                      </Link>
                    </Box>
                    <Organizer
                      organizer={metadata.organizer}
                      artists={artists ? artists : null}
                      organizers={organizers ? organizers : null}
                    />
                  </Box>

                  <Box id="secondary-info" mb={2}>
                    <Typography variant="body2">
                      {metadata.start_time
                        ? new Date(metadata.start_time).toLocaleDateString() +
                          " - " +
                          new Date(metadata.end_time).toLocaleDateString()
                        : eventDate}
                    </Typography>
                    <Typography variant="body2">
                      {metadata.event_location}
                    </Typography>
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
