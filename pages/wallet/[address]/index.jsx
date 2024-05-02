// claim token lists by this wallet address.
// redirect from akadrop claim page.
// when user connect to wallet, if role of user is audience.

/* Providers */
import { ConnectionProvider, useConnection } from "@/packages/providers";
/* MUI */
import Box from "@mui/material/Box";
/* Fetch data */
import { useRouter } from "next/router";
import { WalletRoleAPI } from "@/lib/api";
import { AkaDropAPI } from "@/lib/api";

export default function Wallet({ role, pools, claims, addressFromURL }) {
  /* Connected wallet */
  const { address, connect, disconnect } = useConnection();
  return (
    <>
      <Box>address from URL: {addressFromURL}</Box>
      <Box>address from wallet: {address}</Box>
      {/* <Box>{role.length}</Box> */}
      {/* <Box>{pools}</Box>
      <Box>{claims}</Box> */}
    </>
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
