import "@/styles/global.css";
import type { AppProps } from "next/app";
import Head from "next/head";
import NavBar from "@/components/navBar";

/* Providers */
import { ConnectionProvider } from "@/packages/providers";
import { GlobalProvider } from "@/contexts/GlobalContext";

/* MUI */
import { Box, CssBaseline, ThemeProvider } from "@mui/material";

import theme from "@/styles/theme";
import { Footer } from "@/components/footer";

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
        <GlobalProvider>
          <ThemeProvider theme={theme}>
            <CssBaseline />
            <NavBar />
            <Box sx={{ minHeight: "calc(100vh - 200px)" }}>
              <Component {...pageProps} />
            </Box>
            <Footer />
          </ThemeProvider>
        </GlobalProvider>
      </ConnectionProvider>
    </>
  );
}
