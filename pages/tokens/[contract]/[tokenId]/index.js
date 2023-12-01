import styles from '@/styles/Home.module.css'

/* MUI */
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
/* NavBar - wallet component */
import NavBar from '@/components/NavBar'
/* Fetch data */
import {fetchAPI} from '@/lib/api';
/* NEXT */
import { useRouter } from 'next/router';
/* CardContent */
import CardContent from '@/components/CardContent'


export default function TokenId({data}) {
 
  // const router = useRouter();
  // const { contract, tokenId } = router.query
  // console.log(router.query)
  // console.log(data)

  return (
    <>
      <Container maxWidth="lg">
        <NavBar />
        <CardContent data={data}/>
      </Container>
    </>
  )
}

/* This function gets called at build time */
export async function getStaticPaths() {
    /* Call an external API endpoint to get all tokens */
    const [data] = await Promise.all([
        await fetchAPI("/fa2tokens?limit=10")
      ])
    /* Get the paths we want to pre-render based on contract and tokenId */
    const paths = data.tokens.map((token) => ({
      params: { 
        contract: token.contract ,
        tokenId: token.tokenId.toString()
      },
    }))
    /* We'll pre-render only these paths at build time.  */
    /* { fallback: false } means other routes should 404.  */
    return {
      paths,
      fallback: false,
    };
  }

/* This also gets called at build time */
export async function getStaticProps({ params }) {
  // console.log(params.tokenId)
  const [data] = await Promise.all([
    await fetchAPI(`/fa2tokens/${params.contract}/${params.tokenId}`)
  ])
  /* Pass data to the page via props */
  return { props: { data } };
}


/* use getServerSideProps can also do the same thing as getStaticPaths + getStaticProps */
// export async function getServerSideProps(context) {
//     const{tokenId,contract} = context.params;
//     // console.log(tokenId)
//     // console.log(contract)

//     const [data] = await Promise.all([
//       await fetchAPI(`/fa2tokens/${contract}/${tokenId}`)
//     ])
  
//     return {
//       props: { data },
//       //revalidate: 1,
//     };
//   }