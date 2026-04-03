import { Box, Typography } from "@mui/material";
import Head from "next/head";
import Image from "next/image";
import { useRouter } from "next/router";
import { useT } from "@/lib/i18n/useT";

import bg1 from "@/public/bubble1_bg_sketch.png";
import bg2 from "@/public/bubble2_bg_sketch.png";
import bg3 from "@/public/bubble3_bg_sketch.png";
import bg4 from "@/public/bubble4_bg_sketch.png";

const bgs = [bg1, bg2, bg3, bg4];

/** Parse `_word_` markers into italic spans */
function renderWithEmphasis(text) {
  const parts = text.split(/_(.*?)_/g);
  if (parts.length === 1) return text;
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <em key={i} style={{ fontStyle: "italic", fontWeight: 400 }}>
        {part}
      </em>
    ) : (
      part
    )
  );
}

export default function About() {
  const { locale } = useRouter();
  const t = useT();
  const { sections } = t.about;
  const isEn = locale === "en";

  return (
    <>
      <Head>
        <title>About | Kairos</title>
      </Head>
      <Box
        sx={{
          minHeight: "100vh",
          bgcolor: "#f5f5f5",
          py: { xs: 8, md: 12 },
          px: { xs: 3, md: 6 },
        }}
      >
        <Box sx={{ maxWidth: 960, mx: "auto" }}>
          {sections.map((section, i) => {
            const isOdd = i % 2 === 1;
            return (
              <Box
                key={i}
                sx={{
                  display: "flex",
                  flexDirection: {
                    xs: "column",
                    md: isOdd ? "row-reverse" : "row",
                  },
                  alignItems: { xs: "center", md: "center" },
                  gap: { xs: 4, md: 8 },
                  mb: { xs: 10, md: 14 },
                  "&:last-child": { mb: 0 },
                }}
              >
                {/* Illustration */}
                <Box
                  sx={{
                    flex: "0 0 auto",
                    width: { xs: "60vw", md: "280px" },
                    maxWidth: 320,
                    position: "relative",
                    aspectRatio: "1",
                  }}
                >
                  <Image
                    src={bgs[i]}
                    alt=""
                    fill
                    style={{ objectFit: "contain" }}
                  />
                </Box>

                {/* Text */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="h2"
                    component="h2"
                    sx={{
                      fontSize: { xs: "2rem", md: "3rem" },
                      fontWeight: isEn ? 700 : 800,
                      textTransform: "none",
                      lineHeight: 1.2,
                      letterSpacing: "-0.02em",
                      color: "#1a1a1a",
                      mb: 3,
                    }}
                  >
                    {renderWithEmphasis(section.title)}
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      fontSize: { xs: "1rem", md: "1.15rem" },
                      fontWeight: isEn ? 700 : 400,
                      lineHeight: 1.8,
                      color: "#555",
                      maxWidth: 640,
                    }}
                  >
                    {renderWithEmphasis(section.description)}
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </Box>
    </>
  );
}
