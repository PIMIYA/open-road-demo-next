import Link from "next/link";
import {
  Box,
  Stack,
  Tabs,
  Tab,
  Typography,
} from "@mui/material";

import Tags from "@/components/Tags";
import TokenCollectors from "./TokenCollectors";
import TokenClaimedProgress from "./TokenClaimedProgress";
import RenderMedia from "@/components/render-media";

import { formatDateRange } from "@/lib/stringUtils";

import Organizer from "@/components/Organizer";
import TokenComments from "./TokenComments";

import { useState } from "react";

export default function SingleToken({
  ownersData,
  data,
  organizers,
  artists,
  comments,
}) {
  const total = ownersData?.amount;
  const collected = ownersData ? Object.keys(ownersData?.owners).length - 2 : 0;
  const ownerAddresses = ownersData ? Object.keys(ownersData?.owners) : 0;

  const mimeType = data.metadata.formats[0].mimeType;
  const src = data.metadata;

  /* Tab: Description, Collectors, Comments */
  const [tabValue, setTabValue] = useState(0);

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 6 }}>
      <Stack direction={{ xs: "column", lg: "row" }} spacing={8}>
        {/* Media */}
        <Box
          sx={{
            width: { xs: "100%", lg: "55%" },
            flexShrink: 0,
            height: "auto",
          }}
        >
          <RenderMedia mimeType={mimeType} src={src} />
        </Box>

        {/* Info */}
        <Box sx={{ width: "100%", maxWidth: "65ch" }}>
          <Box mb={2} maxWidth={400}>
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

          {data.metadata.projectName && (
            <Typography variant="h6" component="div" mt={1}>
              <Link
                href="/events/[id]"
                as={`/events/${data.metadata.projectId}`}
              >
                {data.metadata.projectName}
              </Link>
            </Typography>
          )}

          <Box mt={3}>
            <Organizer
              organizer={data.creator}
              artists={artists}
              organizers={organizers}
            />
          </Box>

          <Box mt={3}>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              時間
            </Typography>
            <Typography variant="body2">
              {data.metadata.start_time
                ? formatDateRange(
                    data.metadata.start_time,
                    data.metadata.end_time
                  )
                : data.eventDate}
            </Typography>
          </Box>

          <Box mt={3}>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>
              地點
            </Typography>
            <Typography>{data.eventPlace}</Typography>
          </Box>

          {data.tags && (
            <Box mt={3}>
              <Tags tags={data.tags} />
            </Box>
          )}

          {/* Tabs: Description / Collectors / Comments */}
          <Box mt={4}>
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              sx={{
                borderBottom: "1px solid",
                borderColor: "divider",
                mb: 3,
                "& .MuiTabs-flexContainer": {
                  justifyContent: "flex-start",
                },
                "& .MuiTab-root": {
                  textTransform: "none",
                  fontWeight: 400,
                  fontSize: "0.875rem",
                  minWidth: "auto",
                  px: 2,
                },
                "& .Mui-selected": {
                  fontWeight: 500,
                },
              }}
            >
              <Tab label="Description" />
              <Tab
                label="Collectors"
                disabled={
                  !ownersData ||
                  ownersData.owners === null ||
                  ownerAddresses.length === 0
                }
              />
              <Tab
                label="Comments"
                disabled={
                  !comments ||
                  comments.data === null ||
                  comments.data.length === 0
                }
              />
            </Tabs>

            {/* Description tab */}
            <Box sx={{ display: tabValue === 0 ? "block" : "none" }}>
              {data.metadata.description
                .split("\n")
                .map((paragraph, index) => (
                  <Typography key={index} paragraph>
                    {paragraph}
                  </Typography>
                ))}
            </Box>

            {/* Collectors tab */}
            <Box sx={{ display: tabValue === 1 ? "block" : "none" }}>
              {ownerAddresses !== 0 && (
                <TokenCollectors
                  owners={ownersData.owners}
                  ownerAddresses={ownerAddresses}
                  ownerAliases={ownersData.ownerAliases}
                />
              )}
            </Box>

            {/* Comments tab */}
            <Box sx={{ display: tabValue === 2 ? "block" : "none" }}>
              {ownerAddresses !== 0 && (
                <TokenComments
                  owners={ownersData.owners}
                  ownerAddresses={ownerAddresses}
                  ownerAliases={ownersData.ownerAliases}
                  comments={comments}
                />
              )}
            </Box>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}
