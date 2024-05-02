// list of all creations by the connected wallet which is kairos' 活動方
// TODO: try to use cient side fetching to get the data from api route, but failed when refresh the page.

import { useState, useEffect } from "react";
/* NEXT */
import Link from "next/link";
import styles from "@/styles/CardContent.module.css";
/* Routing */
import { useRouter } from "next/router";
/* MUI */
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Unstable_Grid2";
/* Fetch data */
import { WalletRoleAPI } from "@/lib/api";
import { AkaDropAPI } from "@/lib/api";
/* Components */
import PoolsCreationCardGrid from "@/components/poolsCreationCardGrid";
/* Providers */
import { useConnection } from "@/packages/providers";

export default function Creations() {
  /* Connected wallet */
  const { address, connect, disconnect } = useConnection();
  /*** API ROUTE : using POST to send address to api/walletRoles, and then get back all data by address after client side fetching ***/
  const [roleData, setRoleData] = useState(null);
  const [isLoadingRole, setLoadingRole] = useState(true);

  const [poolData, setPoolData] = useState(null);
  const [isLoadingPool, setLoadingPool] = useState(true);

  useEffect(() => {
    if (!address) {
      return;
    }

    fetch("/api/walletRoles", {
      method: "POST",
      body: address,
    })
      .then((res) => res.json())
      .then((data) => {
        setRoleData(data);
        setLoadingRole(false);
      });

    fetch("/api/walletPools", {
      method: "POST",
      body: address,
    })
      .then((res) => res.json())
      .then((data) => {
        setPoolData(data);
        setLoadingPool(false);
      });
  }, [address]);

  if (isLoadingRole) return <p>Loading...</p>;
  if (!roleData) return <p>No role data</p>;
  //   console.log(data);
  if (isLoadingPool) return <p>Loading...</p>;
  if (!poolData) return <p>No pool data</p>;
  //   console.log(poolData.data);

  return (
    <>
      <Container maxWidth="lg">
        {/* Wallet Info */}
        <Box>
          <Box className={styles.fw700} sx={{ textAlign: "center" }}>
            {`My wallet address: ${address}`}
          </Box>

          <Box className={styles.fw700} sx={{ textAlign: "center" }}>
            {roleData.data.map((r, index) => (
              <Box key={index} component="span" ml={1}>
                {`Team: ${r.team}`}
              </Box>
            ))}
          </Box>
        </Box>
        {/* Wallet Creations */}
        <Box>
          {poolData.data.count > 0 ? (
            <>
              <PoolsCreationCardGrid pools={poolData.data} />
            </>
          ) : (
            "please create a drop first."
          )}
        </Box>
      </Container>
    </>
  );
}

// export async function getServerSideProps(context) {
//   /* get address from click CREATIONS in NAV */
//   const wallet = await context.query;
//   /* Fake wallet address for test claim from akaDrop */
//   // const address = { data: "tz28X7QEXciMxDA1QF8jLp21FuqpqiHrRVZq" };
//   //   console.log(wallet);

//   const [role, pools, claims] = await Promise.all([
//     await WalletRoleAPI(`/${wallet.address}`),
//     await AkaDropAPI(`/${wallet.address}/pools?offset=0&limit=10`),
//     await AkaDropAPI(`/${wallet.address}/claims?offset=0&limit=10`),
//   ]);

//   return {
//     props: { role, pools, claims },
//   };
// }
