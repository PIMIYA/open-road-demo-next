/* MUI */
import { Box, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { FetchDirectusData } from "@/lib/api";
import { useT } from "@/lib/i18n/useT";

export default function TermsofService({ termsData }) {
  const t = useT();
  const { locale } = useRouter();
  const content = locale === "en" && termsData?.content_en ? termsData.content_en : termsData?.content;
  return (
    <Box sx={{ p: 4, maxWidth: "100%", margin: "auto" }}>
      {termsData && (
        <>
          <Typography variant="h1" component="h1" gutterBottom sx={{ textAlign: "center" }}>
            {t.legal.termsLine1}<br />{t.legal.termsLine2}
          </Typography>
          <Box sx={{ mt: 4, mb: 2, maxWidth: "80ch", mx: "auto" }}>
            <Box
              dangerouslySetInnerHTML={{ __html: content }}
              sx={{ mt: 2, mb: 2 }}
            />
          </Box>
        </>
      )}
    </Box>
  );
}

export async function getStaticProps() {
  try {
    const response = await FetchDirectusData("/terms");

    const termsData = response?.data?.[0] || response?.data || null;

    return {
      props: {
        termsData: termsData,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Error fetching terms data:", error);
    return {
      props: {
        termsData: null,
      },
      revalidate: 60,
    };
  }
}
