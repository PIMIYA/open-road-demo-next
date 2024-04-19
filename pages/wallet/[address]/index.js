import { AkaDropAPI } from '@/lib/api';
import { Box, Container, Paper, Stack } from '@mui/material';
import { getRandomText } from '@/lib/dummy';

import WalletProfile from '@/components/wallet/WalletProfile';
import WalletTimeline from '@/components/wallet/WalletTimeline';


export default function Wallet({ address, claims }) {

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
            <WalletProfile address={address} introduction={introduction}></WalletProfile>
          </StyledPaper>
          {/* TODO: filter */}
        </Box>
        <Box width={'100%'}> {/* right */}
          <Box>
            <Stack direction="row">
              <Box width={'100%'}> {/* timeline */}
                <WalletTimeline rawClaims={claims} />
              </Box>
              {/* TODO: analytics */}
            </Stack>
          </Box>
        </Box>
      </Stack>
    </Container>
  );
}

export async function getServerSideProps(context) {
  const query = await context.query;
  const address = query.address;

  /* Fake wallet address for test claim from akaDrop */
  // const address = { data: "tz2LPP7SbQ1xtndsSG2YmyBADVCnFynbqdpD" };

  const [claims] = await Promise.all([
    await AkaDropAPI(`/${address}/claims?offset=0&limit=10`),
  ]);

  return {
    props: { address, claims },
  };
}
