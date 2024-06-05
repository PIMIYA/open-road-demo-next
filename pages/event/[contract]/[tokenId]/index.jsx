/* NEXT */
import dynamic from "next/dynamic";
/* MUI */
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
/* Fetch data */
import { useRouter } from "next/router";
import { MainnetAPI } from "@/lib/api";
/* Components */
import SelectedTokenCardContent from "@/components/selectedTokenCardContent";

export default function TokenId({ data }) {
  // console.log(data)

  return (
    <>
      <Container maxWidth="lg">
        <SelectedTokenCardContent data={data} />
      </Container>
    </>
  );
}

// /* This function gets called at build time */
export async function getStaticPaths() {
  /* Call an external API endpoint to get all tokens */
  const [data] = await Promise.all([await MainnetAPI("/fa2tokens?limit=0")]);
  /* Get the paths we want to pre-render based on contract and tokenId */
  const paths = data.tokens.map((token) => ({
    params: {
      contract: token.contract,
      tokenId: token.tokenId.toString(),
    },
  }));
  /* We'll pre-render only these paths at build time.  */
  /* { fallback: false } means other routes should 404.  */
  return {
    paths,
    fallback: false,
  };
}

/* This also gets called at build time */
export async function getStaticProps({ params }) {
  // console.log(params)
  const [data] = await Promise.all([
    await MainnetAPI(`/fa2tokens/${params.contract}/${params.tokenId}`),
  ]);
  /* Pass data to the page via props */
  return {
    props: { data },
    // revalidate: 10, // In seconds
  };
}

// export async function getServerSideProps(params) {
//   //   console.log(params.params.id);
//   const [data] = await Promise.all([
//     await MainnetAPI(
//       `/fa2tokens/${params.params.contract}/${params.params.tokenId}`
//     ),
//   ]);

//   return {
//     props: { data },
//   };
// }
