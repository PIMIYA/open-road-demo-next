/*** Listing tokens from a specific project ***/

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { paginateAppend } from "@/lib/paginate";
/* MUI */
import { Box, Container, Autocomplete, TextField, Button, Chip } from "@mui/material";
/* Components */
import GeneralTokenCardGrid from "@/components/GeneralTokenCardGrid";
import TwoColumnLayout, {
  Main,
  Side,
} from "@/components/layouts/TwoColumnLayout";
import SidePaper from "@/components/SidePaper";
/* Fetch data */
import { TZKT_API, GetClaimablePoolID, FetchDirectusData } from "@/lib/api";
import { formatDateRange } from "@/lib/stringUtils";

export default function Project({ event, organizers, artists, tokens }) {
  // format event.start_time to GMT timezone, and subtract 8 hours
  const formattedStartTime = event.start_time
    ? new Date(
        new Date(event.start_time).getTime() - 8 * 60 * 60 * 1000
      ).toUTCString()
    : "";
  const formattedEndTime = event.end_time
    ? new Date(
        new Date(event.end_time).getTime() - 8 * 60 * 60 * 1000
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

  // get all categories from data
  const categories = tokens
    ? [...new Set(tokens.map((item) => item.metadata.category))]
    : [];

  // get all tags from data without duplicates
  const tags = tokens
    ? tokens
        .map((item) => item.metadata.tags)
        .flat()
        .filter((item, index, self) => self.indexOf(item) === index)
    : [];

  // Combine artists and organizers for the multi-select filter
  const allCreators = [
    ...(artists?.data || []).map(artist => ({ 
      id: artist.id, 
      name: artist.name, 
      type: 'artist' 
    })),
    ...(organizers?.data || []).map(organizer => ({ 
      id: organizer.id, 
      name: organizer.name, 
      type: 'organizer' 
    }))
  ];

  const [catValue, setCatValue] = useState("");
  const [tagValue, setTagValue] = useState("");
  const [selectedCreators, setSelectedCreators] = useState([]);
  const [filteredData, setFilteredData] = useState(tokens || []);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loaderRef = useRef(null);
  const observerRef = useRef(null);

  // Function to check if a token's organizer contains any of the selected creators
  const checkCreatorMatch = (tokenOrganizer, selectedCreatorNames) => {
    if (!tokenOrganizer || selectedCreatorNames.length === 0) return true;
    
    return selectedCreatorNames.some(creatorName => 
      tokenOrganizer.includes(creatorName)
    );
  };

  const handleFilter = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    const selectedCreatorNames = selectedCreators.map(creator => creator.name);
    
    const filterdByCat = tokens.filter(
      (c) =>
        (!catValue || c.metadata.category.includes(catValue)) &&
        (!tagValue || c.metadata.tags.some((tag) => tag.includes(tagValue))) &&
        checkCreatorMatch(c.metadata.organizer, selectedCreatorNames)
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

  // Custom hook to conditionally use useLayoutEffect on the client side
  const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;

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
            <Box mb={2}>
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
            <Box mb={2}>
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
            <Box mb={2}>
              <Autocomplete
                multiple
                id="creators"
                options={allCreators}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                value={selectedCreators}
                onChange={(event, newValue) => {
                  setSelectedCreators(newValue);
                }}
                renderInput={(params) => (
                  <TextField {...params} label="創作者 / 主辦方" variant="standard" />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      key={option.id}
                      label={`${option.name} (${option.type === 'artist' ? '藝術家' : '主辦方'})`}
                      size="small"
                      {...getTagProps({ index })}
                    />
                  ))
                }
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box>
                      <Box component="span" sx={{ fontWeight: 'bold' }}>
                        {option.name}
                      </Box>
                      <Box component="span" sx={{ color: 'text.secondary', ml: 1 }}>
                        ({option.type === 'artist' ? '藝術家' : '主辦方'})
                      </Box>
                    </Box>
                  </Box>
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
        <Container maxWidth="lg">
          <Box>{event.name}</Box>
          <Box>{event.location}</Box>
          <Box>
            {event.start_time
              ? formatDateRange(formattedStartTime, formattedEndTime)
              : null}
          </Box>
          <Box dangerouslySetInnerHTML={{ __html: event.description }} />
        </Container>
        <Box>{filteredData.length == 0 ? "no data" : ""}</Box>
        <GeneralTokenCardGrid
          data={paginateAppend(filteredData, currentPage, pageSize)}
          organizers={organizers}
          artists={artists}
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

export async function getStaticPaths() {
  const data = await FetchDirectusData(`/events`);
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
  const [event] = await Promise.all([
    await FetchDirectusData(`/events/${params.id}`),
  ]);

  // Fetch burned tokens data
  const burnedData = await TZKT_API(
    `/v1/tokens/transfers?to.eq=tz1burnburnburnburnburnburnburjAYjjX&token.contract=KT1PTS3pPk4FeneMmcJ3HZVe39wra1bomsaW`
  );

  // Extract burned tokenIds and join them into a comma-separated string
  const burned_tokenIds =
    burnedData && Array.isArray(burnedData)
      ? burnedData.map((item) => item.token.tokenId).join(",")
      : "";

  // formate event.data.start_time to GMT timezone, and subtract 8 hours
  const formattedDate = new Date(
    new Date(event.data.start_time).getTime() - 8 * 60 * 60 * 1000
  ).toUTCString();

  const data = await TZKT_API(
    `/v1/tokens?contract=KT1PTS3pPk4FeneMmcJ3HZVe39wra1bomsaW&tokenId.ni=${burned_tokenIds}&sort.desc=tokenId&metadata.event_location=${event.data.location}&metadata.start_time=${formattedDate}` // Filter by event location and formatted start_time
  );

  // Check if tokens are claimable and add claimable status and poolID
  const claimableData =
    data && Array.isArray(data) && data.length > 0
      ? await Promise.all(
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
        )
      : [];

  const [organizers, artists] = await Promise.all([
    await FetchDirectusData(`/organizers`),
    await FetchDirectusData(`/artists`),
  ]);

  return {
    props: {
      event: event.data,
      tokens: claimableData,
      organizers: organizers,
      artists: artists,
    },
    revalidate: 10, // In seconds
  };
}
