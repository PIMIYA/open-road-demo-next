import { useRouter } from "next/router";

import {
  Box,
  Container,
  Divider,
  Stack,
  Typography,
} from "@mui/material";

import Tags from "@/components/Tags";
import TokenClaimedProgress from "../singleToken/TokenClaimedProgress";
import RenderMedia from "@/components/render-media";

import { formatDateRange } from "@/lib/stringUtils";
import { encrypt } from "@/lib/dummy";

export default function NFTclaim({ ownersData, data, children }) {
  const router = useRouter();
  const total = ownersData.amount;
  const collected = ownersData ? Math.max(0, Object.keys(ownersData.owners).length - 2) : 0;

  const url = `${router.query.contract}/${router.query.tokenId}`;
  const hash = encrypt(url);

  const mimeType = data.metadata.formats[0].mimeType;
  const src = data.metadata;
  const poolId = data.poolId;
  const duration = data.duration;

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Stack
        direction={{ xs: "column", lg: "row" }}
        spacing={8}
        alignItems={{ xs: "center", lg: "flex-start" }}
      >
        {/* Media */}
        <Box sx={{ width: { xs: "100%", lg: "50%" }, flexShrink: 0 }}>
          <RenderMedia mimeType={mimeType} src={src} />
        </Box>

        {/* Info */}
        <Box sx={{ width: "100%", maxWidth: "65ch" }}>
          {/* Claimed progress */}
          <Box sx={{ mb: 4 }}>
            {collected !== 0 ? (
              <TokenClaimedProgress collected={collected} total={total} />
            ) : (
              <Typography variant="overline">NO OWNER</Typography>
            )}
          </Box>

          {/* Title */}
          <Typography variant="h1" component="h1" sx={{ mb: 4 }}>
            {data.metadata.name}
          </Typography>

          <Divider sx={{ my: 3 }} />

          {/* Organizer */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="overline" color="text.secondary">
              ORGANIZER
            </Typography>
            <Typography variant="body1">{data.creator}</Typography>
          </Box>

          {/* Time */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="overline" color="text.secondary">
              TIME
            </Typography>
            <Typography variant="body2">
              {data.metadata.start_time
                ? formatDateRange(data.metadata.start_time, data.metadata.end_time)
                : data.eventDate}
            </Typography>
          </Box>

          {/* Location */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="overline" color="text.secondary">
              LOCATION
            </Typography>
            <Typography variant="body1">{data.eventPlace}</Typography>
          </Box>

          {/* Tags */}
          {data.tags && (
            <Box sx={{ mb: 3 }}>
              <Tags tags={data.tags} />
            </Box>
          )}

          <Divider sx={{ my: 3 }} />

          {/* Description */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="overline" color="text.secondary" sx={{ mb: 1, display: "block" }}>
              DESCRIPTION
            </Typography>
            {data.metadata.description.split("\n").map((paragraph, index) => (
              <Typography key={index} variant="body1" paragraph>
                {paragraph}
              </Typography>
            ))}
          </Box>

          {/* Pool duration info */}
          {poolId !== null ? (
            <Box sx={{ border: 1, borderColor: "divider", p: 3, mb: 4 }}>
              <Stack direction="row" justifyContent="space-between">
                <Typography variant="caption">
                  START: {duration.start_time}
                </Typography>
                <Typography variant="caption">
                  END: {duration.end_time}
                </Typography>
              </Stack>
            </Box>
          ) : (
            <Typography variant="caption" color="warning.main" sx={{ mb: 4, display: "block" }}>
              EXPIRED OR NOT ABLE TO CLAIM
            </Typography>
          )}

          {/* Claim action (children = KukaiEmbed + status) */}
          {children}
        </Box>
      </Stack>
    </Container>
  );
}
