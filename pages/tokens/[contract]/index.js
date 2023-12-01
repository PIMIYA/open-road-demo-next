import styles from '@/styles/Home.module.css'

/* MUI */
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
/* NavBar - wallet component */
import NavBar from '@/components/NavBar'
/* Fetch data */
import {fetchAPI} from '@/lib/api';
/* CardGrid */
import CardGrid from '@/components/CardGrid'

import { useRouter } from 'next/router';

export default function Contract({}) {
  const router = useRouter();
  return (
    <>
      {/* <Container maxWidth="lg">
        <div>tokens</div>
        <div>{JSON.stringify(router.query)}</div>
      </Container> */}
    </>
  )
}

/* This function gets called at build time */
export async function getStaticPaths() {
    /* Call an external API endpoint to get all tokens */
    const [data] = await Promise.all([
        await fetchAPI("/fa2tokens?limit=10")
      ])
    /* Get the paths we want to pre-render based on contract */
    const paths = data.tokens.map((t) => ({
      params: { 
        contract: t.contract ,
        // tokenId: t.tokenId.toString()
      },
    }));
    /* We'll pre-render only these paths at build time.  */
    /* { fallback: false } means other routes should 404.  */
    return {
      paths,
      fallback: false,
    };
  }

export const getStaticProps = async (context) => {
  const { params } = context;
  // console.log(params);
  return {
    props: {},
  };
};


