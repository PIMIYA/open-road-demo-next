import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { NextReactP5Wrapper } from "@p5-wrapper/next";

import { Box, Button, Chip, Popper, Stack, Typography } from "@mui/material";
import { getWalletCanvasData } from "@/lib/dummy";
import InfoIcon from '@mui/icons-material/Info';

import sketch from "./sketch";

export default function WalletCanvas() {
  const router = useRouter();
  const address = router.query.address;

  const [dataCount, setDataCount] = useState(10);
  const [data, setData] = useState(null);
  const [tokens, setTokens] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);


  useEffect(() => {
    const data = getWalletCanvasData(dataCount);
    setData(data);
    setTokens(data.claimedTokens);
  }, [dataCount]);

  function handleClick(event) {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  function plus(t) {
    setDataCount(dataCount + t);
  }

  function minus(t) {
    setDataCount(Math.max(1, dataCount - t));
  }

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popper' : undefined;

  return tokens ? (
    <>
      <Box
        aria-describedby={id}
        onClick={handleClick}
        sx={{
          position: 'absolute',
          mt: 1,
          ml: 1,
          zIndex: 1,
        }}
      >
        <Chip
          icon={<InfoIcon />}
          label="你的生成地圖"
          size="small"
        />
      </Box>
      <Popper
        id={id}
        open={open}
        anchorEl={anchorEl}
        placement='bottom-start'
      >
        <Typography
          variant="body2"
          sx={{
            mt: 1,
            p: 1,
            bgcolor: 'background.paper',
            width: 200,
          }}
        >
          根據你過去的活動紀錄生成。每個節點代表你曾參與的活動，形狀代表活動的類型、大小代表活動的規模、顏色代表活動的 tag。
        </Typography>
      </Popper>
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
