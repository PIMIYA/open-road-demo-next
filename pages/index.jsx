// front page with selected event lists

/* NEXT */
import Link from "next/link";
import dynamic from "next/dynamic";
/* Routing */
import { useRouter } from "next/router";
/* MUI */
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Unstable_Grid2";
/* Fetch data */
import { MainnetAPI } from "@/lib/api";
/* Components */
import SelectedTokenCardGrid from "@/components/selectedTokenCardGrid";
import MyPagination from "@/components/myPagination";
import FeatureBox from "@/components/homepage/featureBox";

import { useState } from "react";
import { paginate } from "@/lib/paginate";

export default function Home({ data }) {
  // console.log(data.tokens)

  /* Pagination */
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const onPageChange = (page) => {
    setCurrentPage(page);
  };
  const paginatedPosts = paginate(data.tokens, currentPage, pageSize);

  return (
    <>
      <Container maxWidth="lg">
        <div>開路 KV</div>
        <FeatureBox bgIndex={0} title="紀錄你的藝文活動！" description="每次參加活動，你都能拿到一份屬於該活動的在場證明。內容由創作者決定，可能是節目單、可能是練習的側拍、可能是海報主視覺。" />
        <FeatureBox bgIndex={1} title="與創作者建立連結" description="透過在場證明，創作者將知道誰最常參與過他們的活動。<br />同時，唯有持有在場證明者，可以對活動發表評論。" />
        <FeatureBox bgIndex={2} title="探索喜好" description="透過在場證明，所有人皆可以探索彼此的藝文活動路徑。身為參與者，你可能找到跟你喜好相近的同好；身為創作者，你可能找到將來的合作對象。" />
        <FeatureBox bgIndex={3} title="保有匿名性的開放" description="所有資料都公開於鏈上，所有 ID 都是錢包地址，<br />借助 web3 的技術達到安全、匿名但真實的開放資料。" />
        <Box
          p={6}
          sx={{
            textAlign: "center",
          }}
        >
          fa2 tokens minted on akaSwap
        </Box>
        {!data && <div>A moment please...</div>}
        <SelectedTokenCardGrid data={paginatedPosts} />
        <Box pt={3}>
          <MyPagination
            items={data.tokens.length} // 24
            currentPage={currentPage} // 1
            pageSize={pageSize} // 6
            onPageChange={onPageChange}
          />
        </Box>
      </Container>
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
