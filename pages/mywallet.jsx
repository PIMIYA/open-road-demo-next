/* NEXT */
import dynamic from "next/dynamic";
import styles from "@/styles/CardContent.module.css";
/* MUI */
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Unstable_Grid2";
/* Fetch data */
import { useRouter } from "next/router";
import { TestnetAPI } from "@/lib/api";
import { WalletRoleAPI } from "@/lib/api";
import { AkaDropAPI } from "@/lib/api";
/* Components */
const Nav = dynamic(() => import("@/components/nav"), {
  ssr: false,
});
import PoolsCreationCardGrid from "@/components/poolsCreationCardGrid";
import ClaimsTokenCardGrid from "@/components/claimsTokenCardGrid";

export default function MyWallet({ role, pools, claims }) {
  /* Receive data from Nav */
  const router = useRouter();
  const address = router.query;
  /* Fake wallet address for test claim from akaDrop */
  // const address = { data: "tz28X7QEXciMxDA1QF8jLp21FuqpqiHrRVZq" };
  // console.log(address);
  // test commend

  return (
    <>
      <Container maxWidth="lg">
        <Nav />
        {/* Wallet Info */}
        <Box pt={6} sx={{ textAlign: "center" }}>
          <Box pb={0} component="span" className={styles.fw700}>
            {!address.data
              ? "please connect your wallet"
              : "My wallet address: "}
          </Box>
          <Box pb={0} component="span">
            {address.data}
          </Box>
        </Box>
        {address.data ? (
          <>
            <Box pt={0} sx={{ textAlign: "center" }}>
              {role.length == 0 ? (
                /* 一般大眾 */
                <Box>
                  <Box component="span" className={styles.fw700}>
                    Role:
                  </Box>
                  <Box component="span" className={styles.fw700}>
                    一般大眾
                  </Box>
                </Box>
              ) : (
                /* 活動方 */
                <>
                  <Box>
                    <Box component="span" className={styles.fw700}>
                      Role:
                    </Box>
                    <Box component="span" className={styles.fw700}>
                      活動方
                    </Box>
                  </Box>
                  <Box>
                    <Box component="span" className={styles.fw700}>
                      Team:
                    </Box>
                    <Box component="span">
                      {role.map((r, index) => (
                        <Box key={index} component="span" ml={1}>
                          {r.team}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                </>
              )}
            </Box>
          </>
        ) : null}

        {/* Wallet Creations and Records */}
        {address.data ? (
          <>
            <Box pb={4} pt={8}>
              {!role.length == 0 ? (
                /* 活動方 */
                <>
                  <Box>
                    {pools.count > 0 ? (
                      <>
                        <PoolsCreationCardGrid pools={pools} />
                      </>
                    ) : (
                      "please create a drop first."
                    )}
                  </Box>
                  <Box pt={6}>
                    {claims.count > 0 ? (
                      <>
                        <ClaimsTokenCardGrid claims={claims} />
                      </>
                    ) : (
                      "you do not claim anything yet."
                    )}
                  </Box>
                </>
              ) : (
                /* 一般大眾*/
                <>
                  {claims.count > 0 ? (
                    <>
                      <ClaimsTokenCardGrid claims={claims} />
                    </>
                  ) : (
                    "you do not claim anything yet."
                  )}
                </>
              )}
              <></>
            </Box>
          </>
        ) : null}
      </Container>
    </>
  );
}

export async function getServerSideProps(context) {
  const address = await context.query;
  /* Fake wallet address for test claim from akaDrop */
  // const address = { data: "tz28X7QEXciMxDA1QF8jLp21FuqpqiHrRVZq" };
  // console.log(address);

  const [role, pools, claims] = await Promise.all([
    await WalletRoleAPI(`/${address.data}`),
    await AkaDropAPI(`/${address.data}/pools?offset=0&limit=10`),
    await AkaDropAPI(`/${address.data}/claims?offset=0&limit=10`),
  ]);

  return {
    props: { role, pools, claims },
  };
}
