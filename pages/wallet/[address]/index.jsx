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
import TwoColumnLayout, { Side, Main } from '@/components/layouts/TwoColumnLayout';
import WalletProfile from '@/components/wallet/WalletProfile';
import WalletTimeline from '@/components/wallet/WalletTimeline';
import SidePaper from '@/components/SidePaper';
import Filter from '@/components/Filter';

export default function Wallet({ role, pools, claims, addressFromURL }) {
  /* Connected wallet */
  const { address, connect, disconnect } = useConnection();

  // TODO: get introduction from real data
  const introduction = getRandomText();

  return (
    <TwoColumnLayout>
      <Side>
        <SidePaper>
          <WalletProfile address={addressFromURL} introduction={introduction}></WalletProfile>
        </SidePaper>
        {claims.count > 0 && (
          <SidePaper>
            <Filter />
          </SidePaper>
        )}
      </Side>
      <Main>
        <Box>
          <Stack direction="row">
            <Box width={'100%'}> {/* timeline */}
              <WalletTimeline rawClaims={claims} />
            </Box>
            {/* TODO: analytics */}
          </Stack>
        </Box>
      </Main>
    </TwoColumnLayout>
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
