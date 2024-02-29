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
const Nav = dynamic(() => import("@/components/nav"), {
  ssr: false,
});
import SelectedTokenCardGrid from "@/components/selectedTokenCardGrid";
import MyPagination from "@/components/myPagination";
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
        <Nav />
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
        <MyPagination
          items={data.tokens.length} // 24
          currentPage={currentPage} // 1
          pageSize={pageSize} // 6
          onPageChange={onPageChange}
        />
      </Container>
    </>
  );
}

export async function getServerSideProps() {
  // Fetch data from external API
  const [data] = await Promise.all([await MainnetAPI(`/fa2tokens?limit=24`)]);
  // Pass data to the page via props
  return { props: { data } };
}
