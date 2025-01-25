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
  const [data] = await Promise.all([await MainnetAPI("/fa2tokens?limit=8")]); // Reduced limit from 12 to 8
  /* Get the paths we want to pre-render based on contract and tokenId */
  const paths = data.tokens.map((token) => ({
    params: {
      contract: token.contract,
      tokenId: token.tokenId.toString(),
    },
  }));
  /* We'll pre-render only these paths at build time.  */
  /* { fallback: 'blocking' } means other routes should block until the data is fetched.  */
  return {
    paths,
    fallback: 'blocking', // Changed from false to 'blocking' for better performance
  };
}

/* This also gets called at build time */
export async function getStaticProps({ params }) {
  try {
    const [data] = await Promise.all([
      await MainnetAPI(`/fa2tokens/${params.contract}/${params.tokenId}`),
    ]);
    
    // Add error checking and return minimal required data
    if (!data) {
      return {
        notFound: true,
      }
    }

    return {
      props: { 
        data: {
          // Only include necessary fields
          contract: data.contract,
          tokenId: data.tokenId,
          title: data.title,
          description: data.description,
          // Add other essential fields you need
        }
      },
      revalidate: 3600, // Revalidate every hour
    };
  } catch (error) {
    return {
      notFound: true,
    }
  }
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
