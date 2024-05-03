import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { NextReactP5Wrapper } from "@p5-wrapper/next";

import { Box, Button, Stack } from "@mui/material";
import { getWalletCanvasData } from "@/lib/dummy";

import sketch from "./sketch";

export default function WalletCanvas() {
  const router = useRouter();
  const address = router.query.address;

  const [dataCount, setDataCount] = useState(10);
  const [data, setData] = useState(null);
  const [tokens, setTokens] = useState(null);

  useEffect(() => {
    const data = getWalletCanvasData(dataCount);
    setData(data);
    setTokens(data.claimedTokens);
  }, [dataCount]);

  function plus(t) {
    setDataCount(dataCount + t);
  }

  function minus(t) {
    setDataCount(Math.max(1, dataCount - t));
  }

  return tokens ? (
    <>
      <Box sx={{
        position: 'relative',
        width: '100%',
        mb: 4,
        borderRadius: 2,
        overflow: 'hidden',
        lineHeight: 0,
      }}>
        <NextReactP5Wrapper sketch={sketch} tokens={tokens} walletAddress={address}/>
      </Box>
      {/* <Box>
        {JSON.stringify(data)}
      </Box> */}
      <Stack direction="row" spacing={2} mb={2} alignItems="center">
        <Button onClick={() => {minus(3)}} variant="outlined" size="small">-3</Button>
        <Button onClick={() => {plus(3)}} variant="outlined" size="small">+3</Button>
        <Box>{dataCount}</Box>
      </Stack>
    </>
  ) : null;
}
