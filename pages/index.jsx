/* Fetch data */
import { TZKT_API, MainnetAPI, GetClaimablePoolID } from "@/lib/api";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { useTheme } from "@emotion/react";

/* Components */
import { Box, Button, Container } from "@mui/material";

import KeyVisual from "@/components/homepage/keyVisual";
import FeatureBox from "@/components/homepage/featureBox";
import FadeOnScroll from "@/components/fadeOnScroll";
import GeneralTokenCardGrid from "@/components/GeneralTokenCardGrid";
import Marquee from "@/components/homepage/Marquee";
import Link from "next/link";

const features = [
  {
    title: "紀錄你的藝文參與足跡！",
    description:
      "每次參加現場活動，都能拿到在場證明。內容由創作者決定，可能是節目單、練習的側拍、主視覺或另外創造的作品等。",
  },
  {
    title: "與創作者建立連結",
    description:
      "透過在場證明，創作者將知道參與者也出席過哪些其他活動，藉此找到目標受眾，獎勵粉絲。持有在場證明者也能留下短語，鼓勵創作者。",
    mt: {
      lg: -60,
    },
  },
  {
    title: "探索喜好　認識環境",
    description:
      "在場證明的持有者，代表擁有共同的經歷。可自行組織群組，交流喜好。所有人可以一起看到當前藝術生態系的發展。",
    mt: {
      lg: -10,
    },
  },
  {
    title: "保有匿名性的開放",
    description:
      "參與者保管個資，在場證明公開於鏈上。借助區塊鏈技術，建立安全、匿名但真實的開放資料。",
    mt: {
      lg: -30,
    },
  },
];

export default function Home({ data }) {
  const { isLanded } = useGlobalContext();
  const theme = useTheme();

  // sort data by tokenId
  if (data) {
    data.sort((a, b) => b.tokenId - a.tokenId);
  }

  return (
    <>
      <Container
        maxWidth="lg"
        sx={{
          position: "relative",
          mt: -10,
        }}
      >
        <KeyVisual />
      </Container>
      {isLanded && (
        <Container maxWidth="lg">
          {features.map((feature, index) => (
            <FeatureBox
              key={index}
              bgIndex={index}
              title={feature.title}
              description={feature.description}
              mt={feature.mt}
            />
          ))}
        </Container>
      )}
      {isLanded && (
        <Box
          sx={{
            mt: 10,
            mb: 20,
            transform: "rotateZ(-5deg) scale(1.1)",
          }}
        >
          <Marquee
            variant="h3"
            textTransform="uppercase"
            color="white"
            bgcolor={theme.palette.secondary.main}
            text="We now have 132 tokens, 3 creators, and 12 events in 10 categories. "
          />
        </Box>
      )}
      {isLanded && (
        <Container maxWidth="lg">
          <GeneralTokenCardGrid data={data} />
          <Box textAlign="center" mt={10}>
            <FadeOnScroll onceonly>
              <Link href="/events">
                <Button variant="contained" color="secondary" size="extraLarge">
                  See more
                </Button>
              </Link>
            </FadeOnScroll>
          </Box>
        </Container>
      )}
    </>
  );
}

const contractAddress = "KT1GyHsoewbUGk4wpAVZFUYpP2VjZPqo1qBf";
const targetContractAddress = "KT1PTS3pPk4FeneMmcJ3HZVe39wra1bomsaW";

export async function getStaticProps() {
  // Fetch burned tokens data
  const burnedData = await TZKT_API(
    `/v1/tokens/transfers?to.eq=tz1burnburnburnburnburnburnburjAYjjX&token.contract=KT1PTS3pPk4FeneMmcJ3HZVe39wra1bomsaW`
  );

  // Extract burned tokenIds and join them into a comma-separated string
  const burned_tokenIds = burnedData.map((item) => item.token.tokenId).join(",");

  // Fetch tokens data excluding burned tokens
  const data = await TZKT_API(
    `/v1/tokens?contract=KT1PTS3pPk4FeneMmcJ3HZVe39wra1bomsaW&tokenId.ni=${burned_tokenIds}&sort.desc=tokenId`
  );

  // Check if tokens are claimable and add claimable status and poolID
  const claimableData = await Promise.all(
    data.map(async (item) => {
      const data_from_pool = await GetClaimablePoolID(contractAddress, targetContractAddress, item.tokenId);
      return {
        ...item,
        claimable: !!data_from_pool,
        poolID: data_from_pool ? data_from_pool[0].key : null,
      };
    })
  );

  return {
    props: { data: claimableData },
    revalidate: 10, // In seconds
  };
}
