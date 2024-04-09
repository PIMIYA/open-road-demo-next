// import "@/styles/globals.css";
import type { AppProps } from "next/app";
import Head from "next/head";

/* Providers */
import { ConnectionProvider } from "@/packages/providers";

/* MUI */
import { CssBaseline, ThemeProvider } from "@mui/material";

import NavBar from "@/components/navBar";
import theme from "@/styles/theme";

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
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <NavBar />
          <Component {...pageProps} />
        </ThemeProvider>
      </ConnectionProvider>
    </>
  );
}
