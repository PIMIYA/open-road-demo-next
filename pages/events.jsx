// all event lists

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import { paginateAppend } from "@/lib/paginate";

/* NEXT */
import Link from "next/link";
/* Routing */
import { useRouter } from "next/router";
/* MUI */
import { Box, Autocomplete, TextField, Button } from "@mui/material";
/* Fetch data */
import { TZKT_API, MainnetAPI } from "@/lib/api";
/* Components */
import TwoColumnLayout, {
  Main,
  Side,
} from "@/components/layouts/TwoColumnLayout";
import GeneralTokenCardGrid from "@/components/GeneralTokenCardGrid";
import MyPagination from "@/components/myPagination";
import SidePaper from "@/components/SidePaper";
import Filter from "@/components/Filter";

const categories = [
  { label: "展覽" },
  { label: "表演" },
  { label: "課程" },
  { label: "導覽" },
  { label: "工作坊" },
  { label: "黑客松" },
  { label: "座談" },
  { label: "親子" },
  { label: "節祭／展會／市集" },
  { label: "分享會／同好會／見面會" },
];

const tags = [
  { main: "視覺", sub: "繪畫" },
  { main: "視覺", sub: "裝置" },
  { main: "視覺", sub: "工藝" },
  { main: "視覺", sub: "雕塑" },
  { main: "視覺", sub: "攝影" },
  { main: "視覺", sub: "影像" },
  { main: "表演", sub: "馬戲" },
  { main: "表演", sub: "音樂劇（親子、百老匯）" },
  { main: "表演", sub: "戲曲（歌仔戲、南管、京劇）" },
  { main: "表演", sub: "現代戲劇" },
  { main: "表演", sub: "讀劇" },
  { main: "表演", sub: "音樂（搖滾、古典、電子、音像）" },
  { main: "表演", sub: "說唱（漫才、相聲、站立喜劇）" },
  { main: "表演", sub: "舞蹈（現代舞、舞踏、民俗）" },
  { main: "設計", sub: "平面" },
  { main: "設計", sub: "互動 ／媒體" },
  { main: "設計", sub: "時尚" },
  { main: "設計", sub: "建築" },
  { main: "設計", sub: "工業／商品" },
  { main: "電影", sub: "紀錄片" },
  { main: "電影", sub: "劇情片" },
  { main: "科技", sub: "區塊鏈" },
  { main: "科技", sub: "AI" },
  { main: "科技", sub: "VR／AR／MR" },
  { main: "書籍", sub: "小說" },
  { main: "書籍", sub: "詩歌" },
  { main: "書籍", sub: "散文" },
  { main: "書籍", sub: "漫畫" },
  { main: "文化", sub: "公益（社會運動、地方創生、慈善捐贈）" },
  { main: "文化", sub: "性別" },
  { main: "文化", sub: "語言" },
  { main: "文化", sub: "歷史" },
  { main: "文化", sub: "環境" },
  { main: "文化", sub: "動物" },
  { main: "科學", sub: "社會科學（經濟、政治、國際關係）" },
  { main: "科學", sub: "自然科學（天文、地理）" },
];

export default function Events({ data }) {
  // Search Filter(works but not used)
  // const handleFilter = (event) => {
  //   if (event === null) return;
  //   // const value = event.main || event.sub || event.label || event;
  //   const value = event.target.value;
  //   console.log("event", value);
  //   if (!event) {
  //     setFilteredData(data);
  //     return;
  //   } else {
  //     const filterdByCat = data.filter(
  //       (c) =>
  //         c.metadata.tags.find((tag) => tag.includes(value)) ||
  //         c.metadata.category.includes(value)
  //     );
  //     setFilteredData(filterdByCat);
  //   }
  // };

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
      behavior: 'smooth'
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
  }, [catState, tagState]);

  useLayoutEffect(() => {
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
          {/* <input type="text" onChange={handleFilter} /> */}
          <Box component="form">
            <Box>
              <Autocomplete
                id="category"
                options={categories}
                getOptionLabel={(option) => option.label}
                isOptionEqualToValue={(option, value) =>
                  option.label === value.label
                }
                value={categories.find((cat) => cat.label === catValue) || null}
                onChange={(event, newValue) => {
                  // handleFilter(newValue);
                  setCatValue(newValue ? newValue.label : "");
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
                groupBy={(option) => option.main}
                getOptionLabel={(option) => option.sub}
                value={tags.find((tag) => tag.main === tagValue.split(':')[0] && tag.sub === tagValue.split(':')[1]) || null}
                // isOptionEqualToValue={(option, value) =>
                //   option.label === value.label
                // }
                onChange={(event, newValue) => {
                  // handleFilter(newValue);
                  setTagValue(newValue ? newValue.sub : "");
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
        <GeneralTokenCardGrid data={paginateAppend(filteredData, currentPage, pageSize)} />
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
            {hasMore ? "Loading..." : "No more data"}
          </Box>
        )}
      </Main>
    </TwoColumnLayout>
  );
}

export async function getStaticProps() {
  const burnedData = await Promise.all([
    await TZKT_API(
      `/v1/tokens/transfers?to.eq=tz1burnburnburnburnburnburnburjAYjjX&token.contract=KT1PTS3pPk4FeneMmcJ3HZVe39wra1bomsaW`
    ),
  ]);
  // add burned tokenIds to query and remove burned tokens from the list
  const burned_tokenIds = burnedData[0].map((item) => item.token.tokenId);
  // console.log(burned_tokenIds);
  const joined_burned_tokenIds = burned_tokenIds.join(",");
  // console.log(joined_burned_tokenIds);

  const [data] = await Promise.all([
    await TZKT_API(
      `/v1/tokens?contract=KT1PTS3pPk4FeneMmcJ3HZVe39wra1bomsaW&tokenId.ni=${joined_burned_tokenIds}&sort.desc=tokenId`
    ),
  ]);
  return {
    props: { data },
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 10 seconds
    revalidate: 10, // In seconds
  };
}
