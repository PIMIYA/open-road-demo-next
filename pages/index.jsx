import { MainnetAPI } from "@/lib/api";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { useTheme } from "@emotion/react";

/* Components */
import { Box, Container } from "@mui/material";

import KeyVisual from "@/components/homepage/keyVisual";
import FeatureBox from "@/components/homepage/featureBox";
import FadeOnScroll from "@/components/fadeOnScroll";
import GeneralTokenCardGrid from "@/components/GeneralTokenCardGrid";
import Marquee from "@/components/homepage/Marquee";

const features = [
  {
    title: "紀錄你的藝文參與足跡！",
    description: "每次參加現場活動，都能拿到在場證明。內容由創作者決定，可能是節目單、練習的側拍、主視覺或另外創造的作品等。",
  },
  {
    title: "與創作者建立連結",
    description: "透過在場證明，創作者將知道哪些人最常參與他們的活動，藉此獎勵自己的粉絲，建立會員。同時，持有在場證明者，可以對活動發表評論。"
  },
  {
    title: "探索喜好　認識環境",
    description: "透過在場證明，你能找到喜好相近的朋友；所有人可以一起看到當前藝術生態系的發展。",
  },
  {
    title: "保有匿名性的開放",
    description: "參與者保管個資，在場證明公開於鏈上。借助區塊鏈技術，建立安全、匿名但真實的開放資料。"
  },
];

export default function Home({ data }) {
  const { isLanded } = useGlobalContext();
  const theme = useTheme();

  return (
    <>
      <Container maxWidth="lg">
        <KeyVisual />
      </Container>
        {isLanded &&
          <Container maxWidth="lg">
            {
              features.map((feature, index) => (
                <FeatureBox key={index} bgIndex={index} title={feature.title} description={feature.description} />
              ))
            }
          </Container>
        }
        {isLanded &&
          <Box sx={{
            mt: 35,
            mb: 15,
            transform: "rotateZ(5deg)"
          }}>
            <Marquee
              variant="h3"
              textTransform="uppercase"
              color="white"
              bgcolor={theme.palette.secondary.main}
              text="We now have 132 tokens, 3 creators, and 12 events in 10 categories. "
            />
          </Box>
        }
        {isLanded &&
          <Container maxWidth="lg">
            <FadeOnScroll onceonly>
              <GeneralTokenCardGrid data={data.tokens} />
            </FadeOnScroll>
          </Container>
        }
    </>
  );
}

export async function getStaticProps() {
  const [data] = await Promise.all([await MainnetAPI(`/fa2tokens?limit=24`)]);
  return {
    props: { data },
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 10 seconds
    revalidate: 10, // In seconds
  };
}
