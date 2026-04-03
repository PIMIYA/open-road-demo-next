import Link from "next/link";
import Image from "next/image";

import { Box, Container, List, ListItem, Typography } from "@mui/material";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { useT } from "@/lib/i18n/useT";

import logo from "/public/logo.svg";

export function Footer() {
  const { isLanded } = useGlobalContext();
  const t = useT();

  function FooterLink({ href, label }) {
    return (
      <ListItem
        sx={{
          padding: 0,
          marginBottom: ".5em",
          a: {
            color: "text.primary",
            textDecoration: "none",
            "@media (hover: hover)": {
              "&:hover": {
                textDecoration: "underline",
              },
            },
          },
        }}
      >
        <Link href={href}>
          <Typography variant="body2">{label}</Typography>
        </Link>
      </ListItem>
    );
  }

  return (
    <Box
      sx={{
        bgcolor: "transparent",
        color: "text.primary",
        mt: "5em",
        padding: "2em 0",
        borderTop: "1px solid",
        borderColor: "divider",
        display: isLanded ? "block" : "none",
      }}
    >
      <Container>
        <Box
          sx={{
            width: 130,
            marginLeft: {
              sm: "auto",
            },
          }}
        >

          <List>
            {/* <FooterLink href="/about" label="About" /> */}
            <FooterLink href="/faq" label={t.footer.faq} />
            <FooterLink href="/privacy_policy" label={t.footer.privacy} />
            {/* <FooterLink href="/press_kit" label="Press Kit" /> */}
            <FooterLink href="/terms_of_service" label={t.footer.terms} />
          </List>
          <Typography variant="smallest">{t.footer.copyright}</Typography>
        </Box>
      </Container>
    </Box>
  );
}
