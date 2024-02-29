'use client'

import React, { useState, useEffect } from "react";
/* Taquito */
import { TezosToolkit } from "@taquito/taquito";
import ConnectButton from "@/components/connectToWallet";
import DisconnectButton from "@/components/disconnectToWallet";
/* MUI */
import Box from '@mui/material/Box';
import { styled } from '@mui/material/styles';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Unstable_Grid2';
/* NEXT */
import Link from 'next/link'
/* Routing */
import { useRouter } from "next/router";

enum BeaconConnection {
  NONE = "",
  LISTENING = "Listening to P2P channel",
  CONNECTED = "Channel connected",
  PERMISSION_REQUEST_SENT = "Permission request sent, waiting for response",
  PERMISSION_REQUEST_SUCCESS = "Wallet is connected",
}

/* Style Grid Item */
const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  // padding: theme.spacing(1),
  // textAlign: 'center',
  color: theme.palette.text.secondary,
  boxShadow: "none",
}));

export default function Nav() {

  const [Tezos, setTezos] = useState<TezosToolkit>(
    new TezosToolkit("https://mainnet.ecadinfra.com")
  );
  const [wallet, setWallet] = useState<any>(null);
  const [userAddress, setUserAddress] = useState<string>("");
  const [beaconConnection, setBeaconConnection] = useState<boolean>(false);

  /* Routing - Navigate and send data to mywallet */
  // const router = useRouter();
  // const test_wallet = "tz1h4VfHkUNSpjV7Tc5MbH4PGvbB7ygdTjAR"

  // useEffect(() => {
  //     if (userAddress) {
  //     console.log("just login")
  //     router.push({
  //       pathname: '/audience/[wallet]',
  //       query: { wallet: userAddress, login:"true" },
  //     })
  //   }

  // }, [userAddress])

  return (
    <>
      <Box pt={2} pb={2} sx={{ flexGrow: 1 }}>
        <Grid container spacing={2}>
          <Grid xs={1} md={2}>
            <Item>
              <Link href="/">
                <Box sx={{ color: "#000", textAlign: "left" }}>Home</Box>
              </Link>
            </Item>
          </Grid>
          <Grid xs={5} md={2} xsOffset={2} mdOffset={6}>
            <Item>
              <Box mt={-1} sx={{ cursor: "pointer", textAlign: "right" }}>
                {userAddress ? (
                  <Box>
                    <Link style={{ textDecoration: 'none', color: '#000', fontSize: 30, fontStyle: 'italic', }} href={{ pathname: "/my_wallet", query: { data: userAddress } }} as="/my_wallet">My wallet</Link>
                  </Box>
                  // <Box onClick={() => router.push({
                  //     pathname: '/audience/[wallet]',
                  //     query: { wallet: userAddress },
                  //   })}>
                  //     my wallet
                  // </Box>
                ) : null}
              </Box>
            </Item>
          </Grid>
          <Grid xs={2} md={2} xsOffset={0.5} mdOffset={0}>
            <Item>
              <>
                {(() => {
                  if (userAddress) {
                    return (
                      <Box sx={{ textAlign: "right" }}>
                        <DisconnectButton
                          wallet={wallet}
                          setUserAddress={setUserAddress}
                          setWallet={setWallet}
                          setTezos={setTezos}
                          setBeaconConnection={setBeaconConnection}
                        />
                      </Box>
                    );
                  } else if (!userAddress) {
                    return (
                      <Box sx={{ textAlign: "right" }}>
                        <ConnectButton
                          Tezos={Tezos}
                          setWallet={setWallet}
                          setUserAddress={setUserAddress}
                          setBeaconConnection={setBeaconConnection}
                          wallet={wallet}
                        />
                      </Box>
                    );
                  } else {
                    return <div>An error has occurred</div>;
                  }
                })()}
              </>
            </Item>
          </Grid>
        </Grid>
      </Box>
    </>
  );
}
