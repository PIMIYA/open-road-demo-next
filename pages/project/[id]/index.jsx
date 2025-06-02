/* MUI */
import { Box, Container } from "@mui/material";
/* Components */
import GeneralTokenCardGrid from "@/components/GeneralTokenCardGrid";
/* Fetch data */
import { TZKT_API, GetClaimablePoolID, FetchDirectusData } from "@/lib/api";

export default function Project({ project, organizers, artists, tokens }) {
  // format project.start_time to GMT timezone, and subtract 8 hours
  const formattedStartTime = project.start_time
    ? new Date(
        new Date(project.start_time).getTime() - 8 * 60 * 60 * 1000
      ).toUTCString()
    : "";
  const formattedEndTime = project.end_time
    ? new Date(
        new Date(project.end_time).getTime() - 8 * 60 * 60 * 1000
      ).toUTCString()
    : "";

  /* Mapping tags to new value */
  if (tokens) {
    // sort data by tokenId
    tokens.sort((a, b) => b.tokenId - a.tokenId);
    // if data's category is "座談", change it to "座談會"
    tokens.forEach((item) => {
      if (item.metadata.category === "座談") {
        item.metadata.category = "研討會 / 論壇 / 座談";
      }
    });
    // if data's tags, each include "視覺", then combine and change it to one "視覺藝術"
    tokens.forEach((item) => {
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

  return (
    <>
      <Container maxWidth="lg">
        <Box>{project.name}</Box>
        <Box>{project.location}</Box>
        <Box>
          {project.start_time
            ? new Date(formattedStartTime).toLocaleDateString() +
              " - " +
              new Date(formattedEndTime).toLocaleDateString()
            : null}
        </Box>
        <Box dangerouslySetInnerHTML={{ __html: project.description }} />
      </Container>
      <Container maxWidth="lg">
        <GeneralTokenCardGrid
          data={tokens}
          organizers={organizers}
          artists={artists}
        />
      </Container>
    </>
  );
}

export async function getStaticPaths() {
  const data = await FetchDirectusData(`/projects`);
  const paths = data.data.map((d) => ({
    params: { id: d.id.toString() },
  }));

  return {
    paths,
    fallback: false,
  };
}

const contractAddress = "KT1GyHsoewbUGk4wpAVZFUYpP2VjZPqo1qBf";
const targetContractAddress = "KT1PTS3pPk4FeneMmcJ3HZVe39wra1bomsaW";

export async function getStaticProps({ params }) {
  const [project] = await Promise.all([
    await FetchDirectusData(`/projects/${params.id}`),
  ]);

  // Fetch burned tokens data
  const burnedData = await TZKT_API(
    `/v1/tokens/transfers?to.eq=tz1burnburnburnburnburnburnburjAYjjX&token.contract=KT1PTS3pPk4FeneMmcJ3HZVe39wra1bomsaW`
  );

  // Extract burned tokenIds and join them into a comma-separated string
  const burned_tokenIds = burnedData
    .map((item) => item.token.tokenId)
    .join(",");

  // formate project.data.start_time to GMT timezone, and subtract 8 hours
  const formattedDate = new Date(
    new Date(project.data.start_time).getTime() - 8 * 60 * 60 * 1000
  ).toUTCString();

  const data = await TZKT_API(
    `/v1/tokens?contract=KT1PTS3pPk4FeneMmcJ3HZVe39wra1bomsaW&tokenId.ni=${burned_tokenIds}&sort.desc=tokenId&metadata.event_location=${project.data.location}&metadata.start_time=${formattedDate}` // Filter by event location and formatted start_time
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

  const [organizers, artists] = await Promise.all([
    await FetchDirectusData(`/organizers`),
    await FetchDirectusData(`/artists`),
  ]);

  return {
    props: {
      project: project.data,
      tokens: claimableData,
      organizers: organizers,
      artists: artists,
    },
    revalidate: 10, // In seconds
  };
}
