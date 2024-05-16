// claim token lists by this wallet address.
// redirect from akadrop claim page.

import { useState, useEffect } from "react";
/* Providers */
import { ConnectionProvider, useConnection } from "@/packages/providers";
/* MUI */
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
/* Fetch data */
import { useRouter } from "next/router";
import { WalletRoleAPI } from "@/lib/api";
import { AkaDropAPI } from "@/lib/api";
/* Components */
import ClaimsTokenCardGrid from "@/components/claimsTokenCardGrid";
/* NEXT */
import styles from "@/styles/CardContent.module.css";

export default function Wallet({ role, pools, claims, addressFromURL }) {
  /* Connected wallet */
  const { address, connect, disconnect } = useConnection();

  // const [claimData, setClaimData] = useState(null);
  // const [isLoadingClaim, setLoadingClaim] = useState(true);

  // useEffect(() => {
  //   if (!address) {
  //     return;
  //   }

  //   fetch("/api/walletClaims", {
  //     method: "POST",
  //     body: address,
  //   })
  //     .then((res) => res.json())
  //     .then((data) => {
  //       setClaimData(data);
  //       setLoadingClaim(false);
  //     });
  // }, [address]);

  // if (isLoadingClaim) return <p>Loading...</p>;
  // if (!claimData) return <p>No claim data</p>;
  // console.log(claimData.data);

  return (
    <>
      <Container maxWidth="lg">
        {/* <Box>address from URL: {addressFromURL}</Box>
        <Box>address from wallet: {address}</Box> */}

        {/* Wallet Creations */}
        <Box>
          {claims.count > 0 ? (
            <>
              <ClaimsTokenCardGrid claims={claims} />
              <Box>{address ? "i can comment" : ""}</Box>
            </>
          ) : (
            "you do not claim anything yet."
          )}
        </Box>
      </Container>
    </>
  );
}

export async function getStaticPaths() {
  return {
    paths: [
      {
        params: {
          address: "",
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
