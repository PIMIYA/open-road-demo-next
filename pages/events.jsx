// all event lists

import { useState } from "react";
import { paginate } from "@/lib/paginate";

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
  // sort data by tokenId
  if (data) {
    data.sort((a, b) => b.tokenId - a.tokenId);
  }
  const [filteredData, setFilteredData] = useState(data);
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

  // Selection Filter
  const [catValue, setCatValue] = useState("");
  const [tagValue, setTagValue] = useState("");
  const handleFilter = (event) => {
    if (event === null) return;
    if (!event) {
      setFilteredData(data);
      return;
    } else {
      const filterdByCat = data.filter(
        (c) =>
          c.metadata.tags.find((tag) => tag.includes(tagValue)) &&
          c.metadata.category.includes(catValue)
      );
      setFilteredData(filterdByCat);
    }
  };
  // console.log("filteredData", filteredData);

  /* Pagination */
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const onPageChange = (page) => {
    setCurrentPage(page);
  };
  const paginatedPosts = paginate(filteredData, currentPage, pageSize);

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
                onChange={(event, newValue) => {
                  // handleFilter(newValue);
                  if (newValue) {
                    setCatValue(newValue.label);
                  }
                  if (!newValue) {
                    setCatValue("");
                  }
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
                // isOptionEqualToValue={(option, value) =>
                //   option.label === value.label
                // }
                onChange={(event, newValue) => {
                  // handleFilter(newValue);
                  if (newValue) {
                    setTagValue(newValue.sub);
                  }
                  if (!newValue) {
                    setTagValue("");
                  }
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
        <GeneralTokenCardGrid data={paginatedPosts} />
        <Box pt={3}>
          <MyPagination
            items={filteredData.length} // 24
            currentPage={currentPage} // 1
            pageSize={pageSize} // 6
            onPageChange={onPageChange}
          />
        </Box>
      </Main>
    </TwoColumnLayout>
  );
}

export async function getStaticProps() {
  const [data] = await Promise.all([
    await TZKT_API(
      `/v1/tokens?contract=KT1PTS3pPk4FeneMmcJ3HZVe39wra1bomsaW&tokenId.ni=1,2,3,4,5,6,7,8`
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
