/* MUI */
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { FetchDirectusData } from "@/lib/api";

export default function Faq({ faqData }) {
  return (
    <Box sx={{ p: 4, maxWidth: "100%", margin: "auto" }}>
      <Typography variant="h1" component="h1" gutterBottom>
        {faqData?.title || "Frequently Asked Questions"}
      </Typography>

      {faqData?.content && (
        <Box sx={{ mt: 4 }}>
          <Box
            dangerouslySetInnerHTML={{ __html: faqData.content }}
            sx={{ mt: 2, mb: 2 }}
          />
        </Box>
      )}
    </Box>
  );
}

export async function getStaticProps() {
  try {
    const response = await FetchDirectusData("/faq");

    // 確保我們獲取到正確的數據結構
    const faqData = response?.data?.[0] || response?.data || null;

    return {
      props: {
        faqData: faqData,
      },
      revalidate: 60, // Revalidate every 60 seconds
    };
  } catch (error) {
    console.error("Error fetching FAQ data:", error);
    return {
      props: {
        faqData: null,
      },
      revalidate: 60,
    };
  }
}
