import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { NextReactP5Wrapper } from "@p5-wrapper/next";

import { Box, Button, Chip, Popper, Stack, Typography } from "@mui/material";
import { getWalletCanvasData } from "@/lib/dummy";
import InfoIcon from '@mui/icons-material/Info';

import sketch from "./sketch";
import infoSketch from "./infoSketch";

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

  const handleMouseOver = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  }

  const plus = (t) => {
    setDataCount(dataCount + t);
  }

  const minus = (t) => {
    setDataCount(Math.max(1, dataCount - t));
  }

  const open = Boolean(anchorEl);
  const id = open ? 'simple-popper' : undefined;

  return tokens ? (
    <>
      <Box sx={{
        position: "relative",
        width: "100%",
        mb: 4,
        borderRadius: 2,
        overflow: "hidden",
        lineHeight: 0,
        "&:hover": {
          ".info-sketch-wrapper, .info-chip": {
            opacity: 1
          },
        },
        ".react-p5-wrapper": {
          width: "100%",
        }
      }}>
        <Box
          className="info-sketch-wrapper"
          sx={{
            position: "absolute",
            top: "50px",
            height: "calc(100% - 50px)",
            opacity: 0,
            transition: "opacity 0.3s",
            zIndex: 1,
            ".react-p5-wrapper": {
              height: "100%",
            }
          }}>
          <NextReactP5Wrapper sketch={infoSketch}/>
        </Box>
        <Box
          sx={{
            width: "100%",
            paddingTop: {
              xs: `${100 * 100 / 60}%`,
              sm: "60%",
            },
            ".react-p5-wrapper": {
              position: "absolute",
              top: 0,
              bottom: 0,
              zIndex: 0,
            }
          }}>
          <NextReactP5Wrapper sketch={sketch} tokens={tokens} walletAddress={address}/>
        </Box>
        <Box
          aria-describedby={id}
          onMouseOver={handleMouseOver}
          onMouseOut={() => setAnchorEl(null)}
          className="info-chip"
          sx={{
            opacity: 0,
            position: "absolute",
            zIndex: 2,
            bottom: 10,
            right: 10,
            transition: "opacity 0.3s",
            display: {
              xs: "none",
              sm: "block",
            }
          }}
        >
          <Chip
            icon={<InfoIcon />}
            label="你的生成地圖"
            size="small"
            sx={{
              pointerEvents: "none",
              span: {
                overflow: "unset",
              }
            }}
          />
        </Box>
        <Popper
          id={id}
          open={open}
          anchorEl={anchorEl}
          placement='top-end'
          sx={{
            zIndex: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              mb: 1,
              p: 1,
              bgcolor: 'background.paper',
              color: 'text.primary',
              lineHeight: 1,
              width: 200,
            }}
          >
            根據你過去的活動紀錄生成。每個節點代表你曾參與的活動，形狀代表活動的類型、大小代表活動的規模、顏色代表活動的 tag。
          </Typography>
        </Popper>
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
