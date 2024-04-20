// claim token lists by this wallet address.
// redirect from akadrop claim page.
// when user connect to wallet, if role of user is audience.

/* Providers */
import { ConnectionProvider, useConnection } from "@/packages/providers";
/* MUI */
import { Box, Container, Paper, Stack } from '@mui/material';
/* Fetch data */
import { useRouter } from "next/router";
import { WalletRoleAPI } from "@/lib/api";
import { AkaDropAPI } from "@/lib/api";
/* Dummy for mockup */
import { getRandomText } from '@/lib/dummy';
/* Sub Components */
import WalletProfile from '@/components/wallet/WalletProfile';
import WalletTimeLine from '@/components/wallet/WalletTimeLine';

export default function Wallet({ role, pools, claims, addressFromURL }) {
  /* Connected wallet */
  const { address, connect, disconnect } = useConnection();

  // TODO: get introduction from real data
  const introduction = getRandomText();

  function StyledPaper(props) {
    return (
      <Paper sx={{
        padding: 2,
        boxShadow: 0,
        marginBottom: 4,
      }}>
        {props.children}
      </Paper>
    );
  }

  return (
    <Container maxWidth="lg">
      <Stack direction={
        { md: 'column', lg: 'row' }
      } spacing={4}>
        <Box
          width={{
            md: '100%',
            lg: 300
          }}
        > {/* left */}
          <StyledPaper>
            <WalletProfile address={addressFromURL} introduction={introduction}></WalletProfile>
          </StyledPaper>
          {/* TODO: filter */}
        </Box>
        <Box width={'100%'}> {/* right */}
          <Box>
            <Stack direction="row">
              <Box width={'100%'}> {/* timeline */}
                <WalletTimeLine rawClaims={claims} />
              </Box>
              {/* TODO: analytics */}
            </Stack>
          </Box>
        </Box>
      </Stack>
    </Container>
  );
}

export async function getStaticPaths() {
  return {
    paths: [
      {
        params: {
          address: "tz1h4VfHkUNSpjV7Tc5MbH4PGvbB7ygdTjAR",
        },
      },
    ],
    fallback: "blocking",
  };
}

export async function getStaticProps({ params }) {
  const addressFromURL = await params.address;

  /* Check if the address is valid */
  const res = await fetch(
    `https://api.tzkt.io/v1/accounts?address=${addressFromURL}`
  );
  const address_checker = await res.json();
  if (address_checker.code == 400) {
    return {
      notFound: true,
    };
  }

  /* Fetch data */
  const [role, pools, claims] = await Promise.all([
    await WalletRoleAPI(`/${addressFromURL}`),
    await AkaDropAPI(`/${addressFromURL}/pools?offset=0&limit=10`),
    await AkaDropAPI(`/${addressFromURL}/claims?offset=0&limit=10`),
  ]);

  return {
    props: { role, pools, claims, addressFromURL },
    revalidate: 10,
  };
}
