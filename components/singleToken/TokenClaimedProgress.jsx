import { LinearProgress, Stack, Typography } from "@mui/material";

export default function TokenClaimedProgress({ collected, total }) {
  const collectedPercentage = Math.round((collected / total) * 100);
  return (
    <Stack spacing={1}>
      <LinearProgress variant="determinate" value={collectedPercentage} />
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="caption">
          {collected} / {total} COLLECTED
        </Typography>
        <Typography variant="caption">
          {collectedPercentage}%
        </Typography>
      </Stack>
    </Stack>
  );
}
