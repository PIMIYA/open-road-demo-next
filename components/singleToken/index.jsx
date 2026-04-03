import Link from "next/link";
import {
  Box,
  Divider,
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
import { useT } from "@/lib/i18n/useT";

export default function SingleToken({
  ownersData,
  data,
  organizers,
  artists,
  comments,
  airdropTransfers = [],
}) {
  const total = ownersData?.amount;
  const creatorAddresses = data.metadata?.creators || [];
  const collectorAddresses = [
    ...new Set(
      airdropTransfers
        .map((t) => t.to?.address)
        .filter((addr) => addr && !creatorAddresses.includes(addr))
    ),
  ];
  const collected = collectorAddresses.length;

  const mimeType = data.metadata.formats[0].mimeType;
  const src = data.metadata;

  const t = useT();
  const [tabValue, setTabValue] = useState(0);

  return (
    <Box sx={{ px: { xs: 2, md: 3 }, py: 6 }}>
<Stack direction={{ xs: "column", lg: "row" }} spacing={8}>
        {/* Media */}
        <Box sx={{ width: { xs: "100%", lg: "55%" }, flexShrink: 0 }}>
          <RenderMedia mimeType={mimeType} src={src} />
        </Box>

        {/* Info */}
        <Box sx={{ width: "100%", maxWidth: "65ch" }}>
          {/* Claimed progress */}
          <Box sx={{ mb: 4, maxWidth: 400 }}>
            <TokenClaimedProgress collected={collected} total={total} />
          </Box>

          {/* Title */}
          <Typography variant="h1" component="h1">
            {data.metadata.name}
          </Typography>

          {data.metadata.projectName && (
            <Typography variant="h4" component="div" sx={{ mt: 2 }}>
              <Link
                href="/events/[id]"
                as={`/events/${data.metadata.projectId}`}
              >
                {data.metadata.projectName}
              </Link>
            </Typography>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Organizer */}
          <Box sx={{ mb: 3 }}>
            <Organizer
              organizer={data.creator}
              artists={artists}
              organizers={organizers}
            />
          </Box>

          {/* Time */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ opacity: 0.8, display: "block", lineHeight: 1.2 }}>
              {t.nft.time}
            </Typography>
            <Typography variant="body2">
              {data.metadata.start_time
                ? formatDateRange(data.metadata.start_time, data.metadata.end_time)
                : data.eventDate}
            </Typography>
          </Box>

          {/* Location */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ opacity: 0.8, display: "block", lineHeight: 1.2 }}>
              {t.nft.location}
            </Typography>
            {data.eventPlace && data.metadata?.venue_id && data.metadata?.city_slug ? (
              <Typography variant="body1">
                <Link href={`/?venue=${data.metadata.venue_id}&city=${data.metadata.city_slug}`}>
                  {data.eventPlace}
                </Link>
              </Typography>
            ) : (
              <Typography variant="body1">{data.eventPlace}</Typography>
            )}
          </Box>

          {/* Format */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="caption" sx={{ opacity: 0.8, display: "block", lineHeight: 1.2 }}>
              {t.nft.format}
            </Typography>
            <Typography variant="body2">{mimeType}</Typography>
          </Box>

          {/* Tags */}
          {data.tags && (
            <Box sx={{ mb: 3 }}>
              <Tags tags={data.tags} />
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Tabs: Description / Collectors / Comments */}
          <Box>
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                mb: 3,
                "& .MuiTab-root": {
                  textTransform: "uppercase",
                  fontWeight: 400,
                  fontSize: "11px",
                  letterSpacing: "0.05em",
                  minWidth: "auto",
                  px: 3,
                },
              }}
            >
              <Tab label={t.nft.description} />
              <Tab
                label={<span>{t.nft.collectors}(<i>{collected}</i>)</span>}
                disabled={collected === 0}
              />
              <Tab
                label={<span>{t.nft.comments}(<i>{comments?.data?.length || 0}</i>)</span>}
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
                  <Typography key={index} variant="body1" paragraph>
                    {paragraph}
                  </Typography>
                ))}
            </Box>

            {/* Collectors tab */}
            <Box sx={{ display: tabValue === 1 ? "block" : "none" }}>
              {collected > 0 && (
                <TokenCollectors
                  owners={ownersData.owners}
                  ownerAddresses={collectorAddresses}
                  ownerAliases={ownersData.ownerAliases}
                />
              )}
            </Box>

            {/* Comments tab */}
            <Box sx={{ display: tabValue === 2 ? "block" : "none" }}>
              {comments?.data?.length > 0 && (
                <TokenComments
                  owners={ownersData.owners}
                  ownerAddresses={collectorAddresses}
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
