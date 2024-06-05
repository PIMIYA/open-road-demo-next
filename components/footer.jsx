import Link from 'next/link';
import Image from 'next/image';

import { Box, Container, List, ListItem, Typography } from "@mui/material";
import { useGlobalContext } from "@/contexts/GlobalContext";

import logo from "/public/logo-white.svg";

export function Footer() {
  const { isLanded } = useGlobalContext();

  function FooterLink({ href, label }) {
    return (
      <ListItem
        sx={{
          padding: 0,
          marginBottom: '.5em',
          a: {
            color: 'white',
            textDecoration: 'none',
            '&:hover': {
              textDecoration: 'underline',
            }
          }
        }}
      >
        <Link href={href}>
          <Typography variant="body2">
            {label}
          </Typography>
        </Link>
      </ListItem>
    )
  }

  return (
    <Box
      sx={{
        bgcolor: '#7b7b7b',
        color: 'white',
        mt: '5em',
        padding: '2em 0',
        display: isLanded ? 'block' : 'none',
      }}
    >
      <Container>
        <Box
          sx={{
            width: 130,
            marginLeft: {
              sm: 'auto'
            },
          }}
        >
          <Box>
            <Image
              src={logo}
              alt="Kairos"
              width='100'
              height='100'
              style={{
                width: '100%',
                height: 'auto',
              }}
            />
          </Box>
          <List>
            {/* <FooterLink href="/about" label="About" /> */}
            {/* <FooterLink href="/faq" label="FAQ" /> */}
            {/* <FooterLink href="/privacy_policy" label="Privacy Policy" /> */}
            {/* <FooterLink href="/press_kit" label="Press Kit" /> */}
          </List>
          <Typography variant="smallest">
            Copyright © 2024 Kairos
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
