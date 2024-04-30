import parse from 'html-react-parser';
import Box from "@mui/material/Box";
import Image from "next/image";
import Typography from "@mui/material/Typography";
import FadeOnScroll from "@/components/fadeOnScroll";

import bg1 from "@/public/bubble1_bg.png";
import bg2 from "@/public/bubble2_bg.png";
import bg3 from "@/public/bubble3_bg.png";
import bg4 from "@/public/bubble4_bg.png";
import { useTheme } from '@emotion/react';
import { useEffect, useRef, useState } from 'react';
import { xx } from './utils';
import { useGlobalContext } from '@/contexts/GlobalContext';

const bgs = [bg1, bg2, bg3, bg4];

export default function FeatureBox({ bgIndex, title, description }) {
  const { mousePosition, setMousePosition } = useGlobalContext();
  const theme = useTheme();
  const cardRef = useRef(null);

  const bg = bgs[bgIndex];
  const maxWidthMap = {
    0: 400,
    1: 440,
    2: 500,
    3: 550,
  };

  const [transform, setTransform] = useState('');

  const getTransform = ({x, y}) => {
    const card = cardRef.current;
    if (!card) return '';

    const { left, top, width, height } = card.getBoundingClientRect();

    let rotateX = (y - (top + height / 2)) / height * -30;
    let rotateY = (x - (left + width / 2)) / width * 30;

    // limit rotation
    const maxRotate = 30;
    rotateX = Math.min(maxRotate, Math.max(-maxRotate, rotateX));
    rotateY = Math.min(maxRotate, Math.max(-maxRotate, rotateY));

    return `perspective(1300px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(${50 + bgIndex * 30}px)`;
  }

  useEffect(() => {
    const handler = () => {
      setTransform(getTransform(mousePosition));
    }

    window.addEventListener('mousemove', handler);
    window.addEventListener('scroll', handler);
    return () => {
      window.removeEventListener('mousemove', handler);
      window.removeEventListener('scroll', handler);
    };
  }, [mousePosition]);

  description = parse(description.replaceAll('在場證明', '<strong>在場證明</strong>'));

  return (
    <Box
      sx={{
        maxWidth: {
          sm: 500,
          md: 600,
          lg: maxWidthMap[bgIndex],
        },
        margin: '0 auto',
        mb: 8,
        ':nth-of-type(2n+1)': {
          transform: { lg: 'translateX(60%)'},
        },
        ':nth-of-type(2n)': {
          transform: { lg: 'translateX(-60%)'},
        },
        ':nth-of-type(n + 2)': {
          mt: { lg: -30 },
        },
      }}
    >
      <Box
        ref={cardRef}
        sx={{
          transform,
          transition: 'transform .2s',
        }}
        >
        <FadeOnScroll onceonly>
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
              pointerEvents: 'none',
            }}
          />
          </Box>
        </FadeOnScroll>
        <FadeOnScroll onceonly>
          <Box
            sx={{
              px: { xs: 2, md: 6},
              py: { xs: 2, md: 4 },
            }}
          >
            <Typography
              component='h2'
              variant='h5'
              sx={{
                fontWeight: 'bold',
                background: theme.palette.highlight.main,
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
        </FadeOnScroll>
      </Box>
    </Box>
  );
}
