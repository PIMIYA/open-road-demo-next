import React from 'react';
/* MUI */
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Unstable_Grid2';
/* NavBar - wallet component */
import NavBar from '@/components/NavBar'
/* Routing */
import { useRouter } from 'next/router'

/* Style Grid Item */
const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
}));


export default function Mywallet() {

    /* Receive data from NavBar */
    const router = useRouter();
    const data = router.query;
    // console.log(data.data)

    return (
      <>
        <Container maxWidth="lg">
            <NavBar />
            <div>my wallet</div>
            {!data ? "please connect your wallet" : "" }
            {data &&
              <div>{data.data}</div>
            }  
        </Container>
      </>
    );
  };