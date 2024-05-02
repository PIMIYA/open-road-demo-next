// all event lists

/* NEXT */
import Link from "next/link";
/* Routing */
import { useRouter } from "next/router";
/* MUI */
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
/* Fetch data */
import { MainnetAPI } from "@/lib/api";
/* Components */
import SelectedTokenCardGrid from "@/components/selectedTokenCardGrid";
import MyPagination from "@/components/myPagination";
import { useState } from "react";
import { paginate } from "@/lib/paginate";

export default function Events({ data }) {
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
        <Box p={6} sx={{ textAlign: "center" }}>
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
