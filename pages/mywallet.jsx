import React from "react";
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
/* Components */
import NavBar from "@/components/NavBar";
import WalletCreations from "@/components/WalletCreations";
import AccountRecords from "@/components/AccountRecords";

/* Style Grid Item */
const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === "dark" ? "#1A2027" : "#fff",
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: "center",
  color: theme.palette.text.secondary,
}));

export default function Mywallet({ creations, records, role }) {
  /* Receive data from NavBar */
  const router = useRouter();
  const address = router.query;

  // console.log(creations)
  // console.log(role);

  return (
    <>
      <Container maxWidth="lg">
        <NavBar />
        <Box pt={6} sx={{ textAlign: "center", fontSize: "1.5rem" }}>
          <Box pb={2}>
            {!address.data
              ? "please connect your wallet"
              : "My wallet address: "}
          </Box>
          <Box pb={4}>{address.data}</Box>
        </Box>
        <Box pt={0} sx={{ textAlign: "center", fontSize: "1.5rem" }}>
          {address.data && role.length == 0 ? (
            "一般大眾"
          ) : (
            <Box>
              {role.map((r, index) => (
                <Box key={index}>
                  <Box>permission: {r.permission}</Box>
                  <Box>team: {r.team}</Box>
                </Box>
              ))}
            </Box>
          )}
        </Box>
        {address.data && (
          <>
            <Box pb={4}>
              {/* 不是一般大眾才會看到 */}
              {!role.length == 0 && creations && (
                <>
                  <WalletCreations creations={creations} />
                </>
              )}
            </Box>
            <Box>
              {records && (
                <>
                  <AccountRecords records={records} />
                </>
              )}
            </Box>
          </>
        )}
      </Container>
    </>
  );
}

export async function getServerSideProps(context) {
  const address = context.query;
  // console.log(address.data)
  const [creations, records, role] = await Promise.all([
    await TestnetAPI(`/accounts/${address.data}/creations`),
    await TestnetAPI(`/accounts/${address.data}/records`),
    await WalletRoleAPI(`/${address.data}`),
  ]);

  return {
    props: { creations, records, role },
    //revalidate: 1,
  };
}
