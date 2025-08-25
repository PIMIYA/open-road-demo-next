/* MUI */
import { Box, Typography } from "@mui/material";
import { FetchDirectusData } from "@/lib/api";

export default function TermsofService({ termsData }) {
  console.log("termsData", termsData);
  return (
    <Box sx={{ p: 4, maxWidth: "100%", margin: "auto" }}>
      {termsData && (
        <>
          <Typography variant="h1" component="h1" gutterBottom>
            {"Terms of Service"}
          </Typography>
          <Box sx={{ mt: 4, mb: 2 }}>
            <Box
              dangerouslySetInnerHTML={{ __html: termsData.content }}
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

    // 確保我們獲取到正確的數據結構
    const termsData = response?.data?.[0] || response?.data || null;

    return {
      props: {
        termsData: termsData,
      },
      revalidate: 60, // Revalidate every 60 seconds
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
