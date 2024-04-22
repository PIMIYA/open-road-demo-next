import React, { useState, useEffect } from 'react';
import { Container, Box, Stack } from "@mui/material";

export function Side({ children }) {
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
        setSideContent(child.props.children);
      } else if (child.type.displayName === 'Main') {
        setMainContent(child.props.children);
      }
    });
  }, [children]);

  return (
    <Container maxWidth="lg">
      <Stack direction={
        { md: 'column', lg: 'row' }
      } spacing={4}>
        <Box
          width={{
            md: '100%',
            lg: 300
          }}
        >
          {sideContent}
        </Box>
        <Box width={'100%'}>
          {mainContent}
        </Box>
      </Stack>
    </Container>
  );
}
