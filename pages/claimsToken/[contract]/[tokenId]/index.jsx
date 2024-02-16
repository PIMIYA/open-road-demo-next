/* NEXT */
import dynamic from "next/dynamic";
/* MUI */
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
/* Fetch data */
import { MainnetAPI } from "@/lib/api";
/* Components */
import ClaimsTokenCardContnt from "@/components/claimsTokenCardContnt";
const NavBar = dynamic(() => import("@/components/navBar"), {
  ssr: false,
});
/* Routing */
import { useRouter } from "next/router";

export default function Id({ data }) {
  //   console.log(data);
  // const router = useRouter();
  // const query = router.query;
  // console.log(query);

  return (
    <>
      <Container maxWidth="lg">
        <NavBar />
        <ClaimsTokenCardContnt data={data} />
      </Container>
    </>
  );
}

export async function getServerSideProps(params) {
  //   console.log(params.params.id);
  const [data] = await Promise.all([
    await MainnetAPI(
      `/fa2tokens/${params.params.contract}/${params.params.tokenId}`
    ),
  ]);

  return {
    props: { data },
  };
}
