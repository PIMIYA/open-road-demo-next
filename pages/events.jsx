// all event lists

import { useState } from "react";
import { paginate } from "@/lib/paginate";

/* NEXT */
import Link from "next/link";
/* Routing */
import { useRouter } from "next/router";
/* MUI */
import Box from "@mui/material/Box";
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

export default function Events({ data, nDAta }) {
  // console.log("data", data.tokens);

  // console.log("nDAta", nDAta);
  // const newData = nDAta.filter(function (category) {
  //   return category.metadata.category == "展覽";
  // });
  // console.log("newData", newData);

  /* Pagination */
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 6;
  const onPageChange = (page) => {
    setCurrentPage(page);
  };
  const paginatedPosts = paginate(nDAta, currentPage, pageSize);

  return (
    <TwoColumnLayout>
      <Side sticky>
        <SidePaper>
          <Filter />
        </SidePaper>
      </Side>
      <Main>
        <GeneralTokenCardGrid data={paginatedPosts} />
        <Box pt={3}>
          <MyPagination
            items={nDAta.length} // 24
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
  const [data, nDAta] = await Promise.all([
    await MainnetAPI(
      `/fa2tokens?limit=24&contracts=KT1PTS3pPk4FeneMmcJ3HZVe39wra1bomsaW`
    ),
    await TZKT_API(
      `/v1/tokens?contract=KT1PTS3pPk4FeneMmcJ3HZVe39wra1bomsaW&tokenId.ni=1,2,3,4,5,6,7,8`
    ),
  ]);
  return {
    props: { data, nDAta },
    // Next.js will attempt to re-generate the page:
    // - When a request comes in
    // - At most once every 10 seconds
    revalidate: 10, // In seconds
  };
}
