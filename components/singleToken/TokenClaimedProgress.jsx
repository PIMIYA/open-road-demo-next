import { Box } from "@mui/material";

export default function TokenClaimedProgress({ collected, total }) {
  const collectedPercentage = Math.round((collected / total) * 100);

  return (
    <>
      <Box bgcolor="#eee">
        <Box height={6} width={`$collectedPercentage%`} bgcolor='secondary.main'></Box>
      </Box>
      { collected } / {total} collected
    </>
  );
}
