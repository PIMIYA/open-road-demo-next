/* NEXT */
import dynamic from "next/dynamic";
/* MUI */
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
/* Fetch data */
import { AkaDropAPI } from "@/lib/api";
/* Components */
import PoolsCreationCardContent from "@/components/poolsCreationCardContent";

export default function Id({ data }) {
  //   console.log(data);
  return (
    <>
      <Container maxWidth="lg">
        <PoolsCreationCardContent data={data} />
      </Container>
    </>
  );
}

export async function getServerSideProps(params) {
  const [data] = await Promise.all([
    await AkaDropAPI(`/pools/${params.params.contract}/${params.params.id}`),
  ]);

  return {
    props: { data },
  };
}
