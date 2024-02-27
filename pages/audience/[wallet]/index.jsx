/* NEXT */
import dynamic from "next/dynamic";
/* Fetch data */
import { WalletRoleAPI } from "@/lib/api";
import { useRouter } from "next/router";
/* MUI */
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
/* Components */
// import NavBar from "@/components/NavBar";
const NavBar = dynamic(() => import("@/components/NavBar"), {
  ssr: false,
});

import { useState, useEffect } from "react";

export default function Wallet({ wallet_address, role }) {
  // const [value, setValue] = useState(0);

  const router = useRouter();
  const query = router.query;
  // const loginState = query.login;
  const userAddress = query.wallet;

  // useEffect(() => {
  //     if (loginState === "true") {
  //         setValue(1);
  //     } else {
  //         setValue(0);
  //     }
  // }, [loginState])

  return (
    <>
      <Container maxWidth="lg">
        <NavBar />
        {userAddress ? "i am login" : "i am not login"}
        {/* <Box pt={6} sx={{ textAlign: "center" }}>
                    <Box pb={0} component="span">
                        {!addressFromConnectWallet.wallet
                            ? "please connect your wallet"
                            : "My wallet address: "}
                    </Box>
                    <Box pb={0} component="span">
                        {addressFromConnectWallet.wallet}
                    </Box>
                </Box> */}
      </Container>
      {/* <div>my wallet is {wallet_address}</div> */}
      {/* <div>my wallet is {role.length}</div> */}
      {/* <div>my wallet iis {router.query.wallet}</div> */}
    </>
  );
}

/* This function gets called at build time */
// export async function getStaticPaths() {

//     const test_wallet = "tz1h4VfHkUNSpjV7Tc5MbH4PGvbB7ygdTjAR"
//     const data = [{ params: { wallet: "ss" } }, { params: { wallet: test_wallet } }]
//     // console.log(data)

//     /* Get the paths we want to pre-render based on contract */
//     const paths = data.map((t) => ({
//         params: {
//             wallet: t.params.wallet,
//         },
//     }));
//     // console.log(paths)

//     /* We'll pre-render only these paths at build time.  */
//     /* { fallback: false } means other routes should 404.  */
//     return {
//         paths,
//         fallback: false,
//     };
// }

// /* This also gets called at build time */
// export async function getStaticProps({ params }) {
//     // const router = useRouter();
//     // console.log(router.query.wallet)

//     // console.log(params.wallet)
//     /* address from url path */
//     const wallet_address = params.wallet

//     const [role] = await Promise.all([
//         await WalletRoleAPI(`/${wallet_address}`),
//     ]);
//     /* Pass data to the page via props */
//     return { props: { wallet_address, role } };
// }

/* use getServerSideProps can also do the same thing as getStaticPaths + getStaticProps */
// export async function getServerSideProps(params) {

//     /* address from url path */
//     const wallet_address = await params.params.wallet;
//     // console.log(wallet_address)

//     /* Returns a list of accounts filter by address, means if the address is not in a tezos account */
//     const res = await fetch(`https://api.tzkt.io/v1/accounts?address=${wallet_address}`)
//     const address_checker = await res.json()
//     // console.log(address_checker)

//     /* check address's role */
//     const [role] = await Promise.all([
//         await WalletRoleAPI(`/${wallet_address}`),
//     ]);

//     /* the page will return a 404 even if there was a successfully generated page before. This is meant to support use cases like user-generated content getting removed by its author. */
//     // const data = "s" // null
//     if (address_checker.code == 400) {
//         return {
//             notFound: true,
//         }
//     }

//     // const [data] = await Promise.all([
//     //   await fetchAPI(`/fa2tokens/${contract}/${tokenId}`)
//     // ])

//     return {
//         props: { wallet_address, role },
//         //revalidate: 1,
//     };
// }
