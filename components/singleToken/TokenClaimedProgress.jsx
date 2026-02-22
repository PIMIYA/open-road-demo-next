import { LinearProgress, Typography } from "@mui/material";

export default function TokenClaimedProgress({ collected, total }) {
  const collectedPercentage = Math.round((collected / total) * 100);
  return (
    <>
      <LinearProgress
        variant="determinate"
        value={collectedPercentage}
        sx={{
          "& .MuiLinearProgress-bar": {
            bgcolor: "secondary.main",
          },
        }}
      />
      <Typography variant="body2" sx={{ mt: 1 }}>
        {collected} / {total} collected
      </Typography>
    </>
  );
}
