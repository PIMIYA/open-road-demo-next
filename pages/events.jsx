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

export default function Events({ data, organizers, artists }) {
  // console.log("artists", artists);

  // if data's category is "座談", change it to "座談會"
  data.forEach((item) => {
    if (item.metadata.category === "座談") {
      item.metadata.category = "研討會 / 論壇 / 座談";
    }
  });
  // if data's tags, each include "視覺", then combine and change it to one "視覺藝術"
  data.forEach((item) => {
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

  // get all categories from data
  const categories = [...new Set(data.map((item) => item.metadata.category))];
  // get all tags from data without duplicates
  const tags = data
    .map((item) => item.metadata.tags)
    .flat()
    .filter((item, index, self) => self.indexOf(item) === index);

  const [catValue, setCatValue] = useState("");
  const [tagValue, setTagValue] = useState("");
  const [filteredData, setFilteredData] = useState(data);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);

  const loaderRef = useRef(null);
  const observerRef = useRef(null);

  const handleFilter = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    const filterdByCat = data.filter(
      (c) =>
        (!catValue || c.metadata.category.includes(catValue)) &&
        (!tagValue || c.metadata.tags.some((tag) => tag.includes(tagValue)))
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

  // Custom hook to conditionally use useLayoutEffect on the client side
  const useIsomorphicLayoutEffect =
    typeof window !== "undefined" ? useLayoutEffect : useEffect;

  useEffect(() => {
    if (catState || tagState) {
      setCatValue(catState);
      setTagValue(tagState);
      const filterdByCat = data.filter(
        (c) =>
          (!catState || c.metadata.category.includes(catState)) &&
          (!tagState || c.metadata.tags.some((tag) => tag.includes(tagState)))
      );
      setFilteredData(filterdByCat);
    } else {
      setCatValue("");
      setTagValue("");
      setFilteredData(data);
    }
  }, [catState, tagState, data]);

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
                getOptionLabel={(option) => option}
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
                getOptionLabel={(option) => option}
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

  const [organizers, artists] = await Promise.all([
    await FetchDirectusData(`/organizers`),
    await FetchDirectusData(`/artists`),
  ]);

  if (!organizers || !artists) {
    return {
      notFound: true,
    };
  }

  return {
    props: { data: claimableData, organizers, artists },
    revalidate: 10, // In seconds
  };
}
