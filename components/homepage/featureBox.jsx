import parse from 'html-react-parser';
import Box from "@mui/material/Box";
import Image from "next/image";
import Typography from "@mui/material/Typography";
import { styled } from "@mui/material/styles";

import bg1 from "@/public/bubble1_bg.png";
import bg2 from "@/public/bubble2_bg.png";
import bg3 from "@/public/bubble3_bg.png";
import bg4 from "@/public/bubble4_bg.png";

const bgs = [bg1, bg2, bg3, bg4];

export default function FeatureBox({ bgIndex, title, description }) {
  description = parse(description.replaceAll('在場證明', '<strong>在場證明</strong>'));
  const bg = bgs[bgIndex];

  return (
    <Box
      sx={{
        maxWidth: 600,
        margin: '0 auto',
        mb: 8,
        ':nth-of-type(2n)': {
          transform: { lg: 'translateX(60%)'},
        },
        ':nth-of-type(2n+1)': {
          transform: { lg: 'translateX(-60%)'},
        },
        ':nth-of-type(n + 3)': {
          mt: { lg: -30 },
        }
      }}
    >
      <Box
        sx={{
          maxHeight: 300,
          height: { xs: '45vw', md: '25vw' },
          background: '#fff',
          position: 'relative',
          borderRadius: '4vw',
          border: '1px solid #aaa',
          margin: '0 auto',
        }}
      >
        <Image
          src={bg}
          alt={title}
          style={{
            width: 'auto',
            height: '100%',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        />
      </Box>
      <Box
        sx={{
          px: { xs: 2, md: 6},
          py: { xs: 2, md: 4 },
        }}
      >
        <Typography
          component='h1'
          variant='h5'
          sx={{
            fontWeight: 'bold',
            background: '#FFCE6E',
            display: 'inline-block',
            mb: 2,
          }}
        >
          {title}
        </Typography>
        <Typography
          fontSize={18}
        >
          {description}
        </Typography>
      </Box>
    </Box>
  );
}
