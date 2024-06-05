import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/router";
import { NextReactP5Wrapper } from "@p5-wrapper/next";

import { Box, Button, Chip, Popper, Stack, Typography } from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";

import sketch from "./sketch";
import infoSketch from "./infoSketch";

import { random } from "@/lib/dummy";
import { categoryNames, tagNames } from "./const";

function getWalletCanvasData(canvasData) {
  let count = canvasData.length;

  const result = {
    claimedTokens: [],
    count,
  };

  function getEnglishTagName(chineseName) {
    for (const [english, chinese] of Object.entries(tagNames)) {
      if (chinese === chineseName) {
        return english;
      }
    }

    return null;
  }

  for (let i = 0; i < count; i++) {
    const data = canvasData[i];
    // const totalAmount = ~~random(50, 150);
    // const claimedAmount = ~~random(1, totalAmount);

    let tags = data.token.metadata.tags;
    tags = tags.map(tag => tag.split(':')[0]);
    tags = tags.filter((tag, index) => tags.indexOf(tag) === index);
    tags = tags.map(tag => getEnglishTagName(tag));

    result.claimedTokens.push({
      title: data.token.metadata.name,
      claimedDate: data.token.metadata.date,
      categoryId: Object.values(categoryNames).indexOf(data.token.metadata.category) + 1,
      tags,
      lat: +data.token.metadata.geoLocation[0],
      lan: +data.token.metadata.geoLocation[1],
      // totalAmount,
      // claimedAmount,
      // cliamedPercentage: claimedAmount / totalAmount,
    });
  }

  // sort
  result.claimedTokens.sort((a, b) => {
    return new Date(a.claimedDate) - new Date(b.claimedDate);
  });

  return result;
}

export default function WalletCanvas({ canvasData, address }) {
  const [tokens, setTokens] = useState(canvasData);
  const [anchorEl, setAnchorEl] = useState(null);

  useEffect(() => {
    if (!canvasData) {
      return;
    }
    const walletCanvasData = getWalletCanvasData(canvasData);
    setTokens(walletCanvasData.claimedTokens);
  }, [canvasData]);

  const handleMouseOver = (event) => {
    setAnchorEl(anchorEl ? null : event.currentTarget);
  };

  const open = Boolean(anchorEl);
  const id = open ? "simple-popper" : undefined;

  return tokens ? (
    <>
      <Box
        sx={{
          position: "relative",
          width: "100%",
          mb: 4,
          borderRadius: 2,
          overflow: "hidden",
          lineHeight: 0,
          "&:hover": {
            ".info-sketch-wrapper, .info-chip": {
              opacity: 1,
            },
          },
          ".react-p5-wrapper": {
            width: "100%",
          },
        }}
      >
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
            },
          }}
        >
          <NextReactP5Wrapper sketch={infoSketch} />
        </Box>
        <Box
          sx={{
            width: "100%",
            paddingTop: {
              xs: `${(100 * 100) / 60}%`,
              sm: "60%",
            },
            ".react-p5-wrapper": {
              position: "absolute",
              top: 0,
              bottom: 0,
              zIndex: 0,
            },
          }}
        >
          <NextReactP5Wrapper
            sketch={sketch}
            tokens={tokens}
            walletAddress={address}
          />
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
            },
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
              },
            }}
          />
        </Box>
        <Popper
          id={id}
          open={open}
          anchorEl={anchorEl}
          placement="top-end"
          sx={{
            zIndex: 2,
          }}
        >
          <Typography
            variant="body2"
            sx={{
              mb: 1,
              p: 1,
              bgcolor: "background.paper",
              color: "text.primary",
              lineHeight: 1.5,
              width: 200,
            }}
          >
            根據你過去的活動紀錄生成。每個節點代表你曾參與的活動，形狀代表活動的類型、大小代表活動的規模、顏色代表活動的
            tag。
          </Typography>
        </Popper>
      </Box>
    </>
  ) : null;
}
