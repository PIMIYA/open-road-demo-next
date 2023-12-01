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

export default function Home({data}) {
  // console.log(data.tokens)
  return (
    <>
      <Container maxWidth="lg">
        <NavBar />
        <Box p={6} sx={{textAlign:"center", fontSize: "1.5rem"}}>fa2 tokens minted on akaSwap</Box>
        {!data && <div>A moment please...</div>}
        <CardGrid data={data}/>
      </Container>
    </>
  )
}


export async function getServerSideProps() {
  const [data] = await Promise.all([
    await fetchAPI("/fa2tokens?limit=10")
  ])

  return {
    props: { data },
    //revalidate: 1,
  };
}