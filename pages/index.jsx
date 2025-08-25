import { useEffect, useState } from "react";
/* Fetch data */
import {
  TZKT_API,
  MainnetAPI,
  GetClaimablePoolID,
  FetchDirectusData,
} from "@/lib/api";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { useTheme } from "@emotion/react";
/* MUI */
import { Box, Button, Container, Typography } from "@mui/material";
/* Components */
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

export default function Home({ claimableData, organizers, artists, events }) {
  const { isLanded } = useGlobalContext();
  const theme = useTheme();

  // Helper function to determine event status
  const getEventStatus = (event) => {
    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);

    if (now < startTime) {
      return "upcoming";
    } else if (now >= startTime && now <= endTime) {
      return "current";
    } else {
      return "past";
    }
  };

  // Helper function to get tokens for a specific event
  const getTokensForEvent = (event) => {
    if (!claimableData) return [];

    const formattedEventStartTime = new Date(
      new Date(event.start_time).getTime() - 8 * 60 * 60 * 1000
    ).toUTCString();

    return claimableData
      .filter(
        (item) =>
          item.metadata.event_location === event.location &&
          item.metadata.start_time === formattedEventStartTime
      )
      .slice(0, 3); // Only show 3 NFTs per event
  };

  // Process claimableData as before
  if (claimableData) {
    // sort data by tokenId
    claimableData.sort((a, b) => b.tokenId - a.tokenId);
    // if data's category is "座談", change it to "座談會"
    claimableData.forEach((item) => {
      if (item.metadata.category === "座談") {
        item.metadata.category = "研討會 / 論壇 / 座談";
      }
    });
    // if data's tags, each include "視覺", then combine and change it to one "視覺藝術"
    claimableData.forEach((item) => {
      if (item.metadata.tags.some((tag) => tag.includes("視覺"))) {
        item.metadata.tags = ["視覺藝術"];
      } else if (item.metadata.tags.some((tag) => tag.includes("舞蹈"))) {
        item.metadata.tags = ["舞蹈"];
      } else if (item.metadata.tags.some((tag) => tag.includes("音樂"))) {
        item.metadata.tags = ["音樂"];
      } else if (item.metadata.tags.some((tag) => tag.includes("設計"))) {
        item.metadata.tags = ["設計"];
      } else if (item.metadata.tags.some((tag) => tag.includes("科技"))) {
        item.metadata.tags = ["元宇宙"];
      } else if (item.metadata.tags.some((tag) => tag.includes("書籍"))) {
        item.metadata.tags = ["出版"];
      } else if (item.metadata.tags.some((tag) => tag.includes("科學"))) {
        item.metadata.tags = ["科學"];
      }
    });
  }
  /* add event.data.name to each claimableData item if the event_location and start_time matches a project's location and start_time
   and the project's status is "published"
   and the project's start_time is in GMT timezone, subtract 8 hours */
  if (claimableData && events) {
    claimableData.forEach((item) => {
      const matchingProject = events.data.find(
        (project) =>
          project.status === "published" &&
          project.location === item.metadata.event_location &&
          project.start_time &&
          new Date(
            new Date(project.start_time).getTime() - 8 * 60 * 60 * 1000
          ).toUTCString() === item.metadata.start_time
      );
      if (matchingProject) {
        item.metadata.projectName = matchingProject.name;
        item.metadata.projectId = matchingProject.id;
      } else {
        item.metadata.projectName = "Unknown Project";
      }
    });
  }

  // Categorize events
  const upcomingEvents =
    events?.data?.filter(
      (event) =>
        event.status === "published" && getEventStatus(event) === "upcoming"
    ) || [];

  const currentEvents =
    events?.data?.filter(
      (event) =>
        event.status === "published" && getEventStatus(event) === "current"
    ) || [];

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
          {/* Current Events Section */}
          {currentEvents.length > 0 && (
            <Box mb={6}>
              <Typography variant="h5" component="h5" gutterBottom>
                Current Events
              </Typography>
              {currentEvents.map((event) => {
                const eventTokens = getTokensForEvent(event);
                return (
                  <Box key={event.id} mb={4}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={2}
                    >
                      <Typography>{event.name}</Typography>
                      <Link href={`/events/${event.id}`}>
                        <Button variant="outlined" color="primary" size="small">
                          See more
                        </Button>
                      </Link>
                    </Box>
                    {eventTokens.length > 0 && (
                      <GeneralTokenCardGrid
                        data={eventTokens}
                        organizers={organizers}
                        artists={artists}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Upcoming Events Section */}
          {upcomingEvents.length > 0 && (
            <Box mb={6}>
              <Typography variant="h5" component="h5" gutterBottom>
                Upcoming Events
              </Typography>
              {upcomingEvents.map((event) => {
                const eventTokens = getTokensForEvent(event);
                return (
                  <Box key={event.id} mb={4}>
                    <Box
                      display="flex"
                      justifyContent="space-between"
                      alignItems="center"
                      mb={2}
                    >
                      <Typography>{event.name}</Typography>
                      <Link href={`/events/${event.id}`}>
                        <Button variant="outlined" color="primary" size="small">
                          See more
                        </Button>
                      </Link>
                    </Box>
                    {eventTokens.length > 0 && (
                      <GeneralTokenCardGrid
                        data={eventTokens}
                        organizers={organizers}
                        artists={artists}
                      />
                    )}
                  </Box>
                );
              })}
            </Box>
          )}

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
  const burned_tokenIds = burnedData
    .map((item) => item.token.tokenId)
    .join(",");

  // Fetch tokens data excluding burned tokens
  const data = await TZKT_API(
    `/v1/tokens?contract=KT1PTS3pPk4FeneMmcJ3HZVe39wra1bomsaW&tokenId.ni=${burned_tokenIds}&sort.desc=tokenId`
  );

  // Check if tokens are claimable and add claimable status and poolID
  const claimableData = await Promise.all(
    data.map(async (item) => {
      const data_from_pool = await GetClaimablePoolID(
        contractAddress,
        targetContractAddress,
        item.tokenId
      );
      return {
        ...item,
        claimable: !!data_from_pool,
        poolID: data_from_pool ? data_from_pool[0].key : null,
      };
    })
  );

  const [organizers, artists, events] = await Promise.all([
    await FetchDirectusData(`/organizers`),
    await FetchDirectusData(`/artists`),
    await FetchDirectusData(`/events`),
  ]);

  return {
    props: {
      claimableData: claimableData,
      organizers: organizers,
      artists: artists,
      events: events,
    },
    revalidate: 10, // In seconds
  };
}
