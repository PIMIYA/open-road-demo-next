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
import { formatDateRange } from "@/lib/stringUtils";
import FadeOnScroll from "./fadeOnScroll";

export default function EventCardGrid(props) {
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
                id,
                name,
                start_time,
                end_time,
                description,
                location,
                cover,
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
                  <Link href="/events/[id]" as={`/events/${id}`}>
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
                        alt="event cover"
                        sx={{
                          objectFit: "contain",
                          height: "100%",
                          width: "100%",
                          margin: "auto",
                        }}
                        image={cover || "https://dummyimage.com/400x200/cccccc/666666?text=Cover"}
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
                        {name}
                      </Typography>
                    </Stack>
                  </Box>

                  <Box id="secondary-info" mb={2}>
                    <Typography variant="body2">
                      {start_time && end_time
                        ? formatDateRange(start_time, end_time)
                        : start_time
                        ? new Date(start_time).toLocaleDateString()
                        : "TBD"}
                    </Typography>
                    <Typography variant="body2">
                      {location || "Location TBD"}
                    </Typography>
                  </Box>
                  
                  {description && (
                    <Box 
                      variant="body2" 
                      color="text.secondary" 
                      mb={2}
                      dangerouslySetInnerHTML={{ 
                        __html: description.length > 200 
                          ? `${description.substring(0, 200)}...` 
                          : description 
                      }}
                      sx={{
                        fontSize: '0.875rem',
                        color: 'text.secondary',
                        '& p': {
                          margin: 0,
                        },
                        '& *': {
                          fontSize: 'inherit',
                          color: 'inherit',
                        }
                      }}
                    />
                  )}
                </Box>
              </Grid>
            )
          )}
      </Grid>
    </>
  );
}
