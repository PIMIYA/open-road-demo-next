// import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
/* Providers */
import { ConnectionProvider, useConnection } from "@/packages/providers";
/* MUI */
import Box from "@mui/material/Box";
import { styled } from "@mui/material/styles";
import Paper from "@mui/material/Paper";
import Grid from "@mui/material/Unstable_Grid2";
import Button from "@mui/material/Button";
import { createTheme, ThemeProvider } from "@mui/material/styles";

import Image from 'next/image';
import logo from "/public/logo.svg";

const theme = createTheme({
  palette: {
    primary: { main: "#ffffff" },
    secondary: { main: "#000000" },
  },
});

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Kairos Demo</title>
        <meta name="description" content="Demo dApp" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <ConnectionProvider>
        <NavBar />
        <Component {...pageProps} />
      </ConnectionProvider>
    </>
  );
}

const NavBar = () => {
  /* Connected wallet */
  const { address, connect, disconnect } = useConnection();
  // console.log(connect);
  const router = useRouter();
  const gotohome = () => {
    router.push("/");
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "1rem",
        background: "none",
      }}
    >
      <ThemeProvider theme={theme}>
        <Button disableRipple={true} onClick={gotohome}>
          <Image
            priority
            src={logo}
            alt="Kairos"
            onClick={gotohome}
          />
        </Button>
      </ThemeProvider>
      <div>
        {address ? (
          <>
            <Box component="span">
              <Link href={{ pathname: "/mint" }} as="/mint">
                <ThemeProvider theme={theme}>
                  <Button variant="text" color="secondary">
                    mint
                  </Button>
                </ThemeProvider>
              </Link>
            </Box>
            <Box component="span">
              <Link
                /* In order to fetch data every time load page, send address from URL  */
                href={{
                  pathname: `/creations`,
                  // query: { address: address }
                }}
                // as="/creations"
              >
                <ThemeProvider theme={theme}>
                  <Button variant="text" color="secondary">
                    creations
                  </Button>
                </ThemeProvider>
              </Link>
            </Box>
            <Box component="span">
              <Link
                href={{
                  pathname: `/wallet/${address}`,
                  // query: { address: address },
                }}
                // as="/my_wallet"
              >
                <ThemeProvider theme={theme}>
                  <Button variant="text" color="secondary">
                    wallet
                  </Button>
                </ThemeProvider>
              </Link>
            </Box>
            <Box component="span">
              <ThemeProvider theme={theme}>
                <Button
                  variant="outlined"
                  color="secondary"
                  onClick={disconnect}
                >
                  disconnect
                </Button>
              </ThemeProvider>
            </Box>
          </>
        ) : (
          <>
            <ThemeProvider theme={theme}>
              <Button variant="outlined" color="secondary" onClick={connect}>
                connect
              </Button>
            </ThemeProvider>
          </>
        )}
      </div>
    </Box>
  );
};
