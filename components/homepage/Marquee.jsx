import { Box, Typography } from "@mui/material";
import { useEffect, useRef, useState } from "react";

export default function Marquee({
  variant,
  textTransform,
  color,
  bgcolor,
  text,
}) {
  const ref = useRef(null);
  const [height, setHeight] = useState(0);
  const [duration, setDuration] = useState(20);

  useEffect(() => {
    if (ref.current) {
      setHeight(ref.current.clientHeight);
      const width = ref.current.clientWidth;
      setDuration(width / 200);
    }
  }, [ref.current]);

  return (
    <Box sx={{
      width: '100%',
      height,
      overflow: 'hidden',
      position: 'relative',
    }}>
      <Typography
        ref={ref}
        variant={variant || 'h6'}
        textTransform={textTransform || 'none'}
        bgcolor={bgcolor || 'inherit'}
        color={color || 'inherit'}
        component='div'
        noWrap
        sx={{
          position: 'absolute',
          animation: `marquee ${duration}s linear infinite`,
          '@keyframes marquee': {
            '0%': { transform: 'translateX(0%)' },
            '100%': { transform: 'translateX(-50%)' },
          },
        }}
      >
        {text}{text}{text}{text}{text}{text}
      </Typography>
    </Box>
  );
}
