/* MUI */
import { Box, Typography } from "@mui/material";
import { FetchDirectusData } from "@/lib/api";

export default function PrivacyPolicy({ policyData }) {
  return (
    <Box sx={{ p: 4, maxWidth: "100%", margin: "auto" }}>
      {policyData && (
        <Box sx={{ mt: 4, mb: 2 }}>
          <Typography variant="h1" component="h1" gutterBottom>
            {policyData.title || "Privacy Policy"}
          </Typography>
          {policyData.last_updated && (
            <Typography variant="h3" component="h3" sx={{ mt: 2, mb: 2 }}>
              Last Updated: {policyData.last_updated}
            </Typography>
          )}
          <Box
            dangerouslySetInnerHTML={{ __html: policyData.content }}
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
    
    // 確保我們獲取到正確的數據結構
    const policyData = response?.data?.[0] || response?.data || null;
    
    return {
      props: {
        policyData: policyData,
      },
      revalidate: 60, // Revalidate every 60 seconds
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
