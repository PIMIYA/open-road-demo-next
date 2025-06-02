// all event lists

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { paginateAppend } from "@/lib/paginate";
/* Routing */
import { useRouter } from "next/router";
/* MUI */
import { Box, Autocomplete, TextField, Button } from "@mui/material";
/* Fetch data */
import {
  TZKT_API,
  MainnetAPI,
  GetClaimablePoolID,
  FetchDirectusData,
} from "@/lib/api";
/* Components */
import TwoColumnLayout, {
  Main,
  Side,
} from "@/components/layouts/TwoColumnLayout";
import GeneralTokenCardGrid from "@/components/GeneralTokenCardGrid";
import SidePaper from "@/components/SidePaper";

export default function Events({
  claimableData,
  organizers,
  artists,
  projects,
}) {
  // console.log("projects", projects);
  if (claimableData) {
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
  /* add projects.data.name to each claimableData item if the event_location and start_time matches a project's location and start_time
   and the project's status is "published"
   and the project's start_time is in GMT timezone, subtract 8 hours */
  if (claimableData && projects) {
    claimableData.forEach((item) => {
      const matchingProject = projects.data.find(
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
      }
    });
  }

  // console.log("claimableData", claimableData);

  // get all categories from data
  const categories = [
    ...new Set(claimableData.map((item) => item.metadata.category)),
  ];
  // get all tags from data without duplicates
  const tags = claimableData
    .map((item) => item.metadata.tags)
    .flat()
    .filter((item, index, self) => self.indexOf(item) === index);

  // get all project names from data
  const projectNames = [
    ...new Set(claimableData.map((item) => item.metadata.projectName)),
  ];

  const [catValue, setCatValue] = useState("");
  const [tagValue, setTagValue] = useState("");
  const [projectValue, setProjectValue] = useState("");
  const [filteredData, setFilteredData] = useState(claimableData);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loaderRef = useRef(null);
  const observerRef = useRef(null);

  const handleFilter = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    const filterdByCat = claimableData.filter(
      (c) =>
        (!catValue || c.metadata.category.includes(catValue)) &&
        (!tagValue || c.metadata.tags.some((tag) => tag.includes(tagValue))) &&
        (!projectValue ||
          (c.metadata.projectName &&
            c.metadata.projectName.includes(projectValue)))
    );
    changePage(1);
    setFilteredData(filterdByCat);
  };

  /* Pagination */
  const pageSize = 6;
  const changePage = (page) => {
    if (!hasMore && page != 1) return;
    setCurrentPage(page);
  };

  /* Router */
  const router = useRouter();
  const catState = router.query.cat ? router.query.cat : "";
  const tagState = router.query.tag ? router.query.tag : "";
  const projectState = router.query.project ? router.query.project : "";

  // Custom hook to conditionally use useLayoutEffect on the client side
  const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;

  useEffect(() => {
    if (catState || tagState) {
      setCatValue(catState);
      setTagValue(tagState);
      setProjectValue(projectState);
      const filterdByCat = claimableData.filter(
        (c) =>
          (!catState || c.metadata.category.includes(catState)) &&
          (!tagState ||
            c.metadata.tags.some((tag) => tag.includes(tagState))) &&
          (!projectValue || c.metadata.projectName.includes(projectValue))
      );
      setFilteredData(filterdByCat);
    } else {
      setCatValue("");
      setTagValue("");
      setProjectValue("");
      setFilteredData(claimableData);
    }
  }, [catState, tagState, claimableData]);

  useIsomorphicLayoutEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          changePage(currentPage + 1);
        }
      },
      { threshold: 1 }
    );

    if (loaderRef.current) {
      observerRef.current.observe(loaderRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, currentPage]);

  useEffect(() => {
    setHasMore(currentPage * pageSize < filteredData.length);
  }, [currentPage, filteredData]);

  return (
    <TwoColumnLayout>
      <Side sticky>
        <SidePaper>
          <Box component="form">
            <Box>
              <Autocomplete
                id="category"
                options={categories}
                getOptionLabel={(option) => (option ? option : "")}
                isOptionEqualToValue={(option, value) => option === value}
                value={categories.find((cat) => cat === catValue) || null}
                onChange={(event, newValue) => {
                  setCatValue(newValue ? newValue : "");
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Category" variant="standard" />
                )}
              />
            </Box>
            <Box>
              <Autocomplete
                id="tag"
                options={tags}
                getOptionLabel={(option) => (option ? option : "")}
                value={tags.find((tag) => tag === tagValue) || null}
                isOptionEqualToValue={(option, value) => option === value}
                onChange={(event, newValue) => {
                  setTagValue(newValue ? newValue : "");
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Tag" variant="standard" />
                )}
              />
            </Box>
            <Box>
              <Autocomplete
                id="project"
                options={projectNames}
                getOptionLabel={(option) => (option ? option : "")}
                value={
                  projectNames.find(
                    (projectName) => projectName === projectValue
                  ) || null
                }
                isOptionEqualToValue={(option, value) => option === value}
                onChange={(_, newValue) => {
                  setProjectValue(newValue ? newValue : "");
                }}
                renderInput={(params) => (
                  <TextField {...params} label="Project" variant="standard" />
                )}
              />
            </Box>
          </Box>
          <Box mt={4}>
            <Button
              variant="contained"
              color="primary"
              size="small"
              onClick={handleFilter}
            >
              Apply
            </Button>
          </Box>
        </SidePaper>
      </Side>
      <Main>
        <Box>{filteredData.length == 0 ? "no data" : ""}</Box>
        <GeneralTokenCardGrid
          data={paginateAppend(filteredData, currentPage, pageSize)}
          organizers={organizers}
          artists={artists}
          projects={projects}
        />
        {filteredData.length > 0 && (
          <Box
            ref={loaderRef}
            sx={{
              display: "flex",
              justifyContent: "center",
              pt: 4,
              color: "text.secondary",
            }}
          >
            {hasMore ? "Loading..." : ""}
          </Box>
        )}
      </Main>
    </TwoColumnLayout>
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

  const [organizers, artists, projects] = await Promise.all([
    await FetchDirectusData(`/organizers`),
    await FetchDirectusData(`/artists`),
    await FetchDirectusData(`/projects`),
  ]);

  return {
    props: {
      claimableData: claimableData,
      organizers: organizers,
      artists: artists,
      projects: projects,
    },
    revalidate: 10, // In seconds
  };
}
