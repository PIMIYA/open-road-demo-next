/* NEXT */
import dynamic from "next/dynamic";
/* MUI */
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
/* Fetch data */
import { AkaDropAPI } from "@/lib/api";
/* Components */
import PoolsCreationCardContent from "@/components/poolsCreationCardContent";
// const Nav = dynamic(() => import("@/components/nav"), {
//   ssr: false,
// });
import Nav from "@/components/nav";

export default function Id({ data }) {
  //   console.log(data);

  return (
    <>
      <Container maxWidth="lg">
        <Nav />
        <PoolsCreationCardContent data={data} />
      </Container>
    </>
  );
}

export async function getServerSideProps(params) {
  //   console.log(params.params.id);
  // const res = await fetch(
  //   `https://mars.akaswap.com/drop/api/pools/${params.params.contract}/${params.params.id}`
  // );
  // const data = await res.json();
  const [data] = await Promise.all([
    await AkaDropAPI(`/pools/${params.params.contract}/${params.params.id}`),
  ]);

  return {
    props: { data },
  };
}
