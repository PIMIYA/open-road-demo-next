import { LinearProgress, Stack, Typography } from "@mui/material";
import { useT } from "@/lib/i18n/useT";

export default function TokenClaimedProgress({ collected, total }) {
  const t = useT();
  const collectedPercentage = total ? Math.round((collected / total) * 100) : 0;
  return (
    <Stack spacing={1}>
      <LinearProgress variant="determinate" value={collectedPercentage} />
      <Stack direction="row" justifyContent="space-between">
        <Typography variant="caption">
          {collected} / {total} {t.nft.collected}
        </Typography>
        <Typography variant="caption">
          {collectedPercentage}%
        </Typography>
      </Stack>
    </Stack>
  );
}
