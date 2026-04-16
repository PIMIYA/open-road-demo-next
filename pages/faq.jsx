/* MUI */
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useRouter } from "next/router";
import { FetchDirectusData } from "@/lib/api";
import { useT } from "@/lib/i18n/useT";

export default function Faq({ faqData }) {
  const t = useT();
  const { locale } = useRouter();
  const content = locale === "en" && faqData?.content_en ? faqData.content_en : faqData?.content;
  return (
    <Box sx={{ p: 4, maxWidth: "100%", margin: "auto" }}>
      <Typography variant="h1" component="h1" gutterBottom>
        {faqData?.title || t.faq.title}
      </Typography>

      {content && (
        <Box sx={{ mt: 4 }}>
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
    const response = await FetchDirectusData("/faq");

    const faqData = response?.data?.[0] || response?.data || null;

    return {
      props: {
        faqData: faqData,
      },
      revalidate: 60,
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
