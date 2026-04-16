/* MUI */
import { Box, Typography } from "@mui/material";
import { useRouter } from "next/router";
import { FetchDirectusData } from "@/lib/api";
import { useT } from "@/lib/i18n/useT";

export default function PrivacyPolicy({ policyData }) {
  const t = useT();
  const { locale } = useRouter();
  const content = locale === "en" && policyData?.content_en ? policyData.content_en : policyData?.content;
  return (
    <Box sx={{ p: 4, maxWidth: "100%", margin: "auto" }}>
      {policyData && (
        <Box sx={{ mt: 4, mb: 2, maxWidth: "80ch", mx: "auto" }}>
          <Typography variant="h1" component="h1" gutterBottom>
            {policyData.title || t.legal.privacy}
          </Typography>
          {policyData.last_updated && (
            <Typography variant="h3" component="h3" sx={{ mt: 2, mb: 2 }}>
              Last Updated: {policyData.last_updated}
            </Typography>
          )}
          <Box
            dangerouslySetInnerHTML={{ __html: content }}
            sx={{ mt: 2, mb: 2 }}
          />
        </Box>
      )}
    </Box>
  );
}

export async function getStaticProps() {
  try {
    const response = await FetchDirectusData("/policy");

    const policyData = response?.data?.[0] || response?.data || null;

    return {
      props: {
        policyData: policyData,
      },
      revalidate: 60,
    };
  } catch (error) {
    console.error("Error fetching policy data:", error);
    return {
      props: {
        policyData: null,
      },
      revalidate: 60,
    };
  }
}
