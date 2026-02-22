import React, { useState, useEffect } from 'react';
import { Box, Stack } from "@mui/material";

export function Side({ sticky, children }) {
  if (sticky) {
    return (
      <Box sx={{
        position: 'sticky',
        top: 100,
      }}>
        {children}
      </Box>
    );
  }
  return <>{children}</>;
};

Side.displayName = 'Side';

export function Main({ children }) {
  return <>{children}</>;
};
Main.displayName = 'Main';

export default function TwoColumnLayout({ children }) {
  const [sideContent, setSideContent] = useState(null);
  const [mainContent, setMainContent] = useState(null);

  useEffect(() => {
    React.Children.forEach(children, child => {
      if (child.type.displayName === 'Side') {
        setSideContent(child);
      } else if (child.type.displayName === 'Main') {
        setMainContent(child);
      }
    });
  }, [children]);

  return (
    <Box sx={{ px: '2rem' }}>
      <Stack direction={
        { xs: 'column', lg: 'row' }
      } spacing={4}>
        <Box
          sx={{
            width: { md: '100%', lg: 400 },
            position: 'relative',
            zIndex: 2,
          }}
        >
          {sideContent}
        </Box>
        <Box sx={{
          width: '100%',
          mt: { xs: 4, lg: 0 },
          pt: { lg: '4rem' },
          pl: { lg: '4rem' },
        }}>
          {mainContent}
        </Box>
      </Stack>
    </Box>
  );
}
