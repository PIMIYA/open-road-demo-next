/* Next */
import { useEffect } from "react";
import type { AppProps } from "next/app";
import { useRouter } from "next/router";
import Head from "next/head";
/* Providers */
import { ConnectionProvider } from "@/packages/providers";
import { GlobalProvider } from "@/contexts/GlobalContext";
import { UIEnvironmentProvider } from "@/contexts/UIEnvironmentContext";
/* MUI */
import { Box, CssBaseline, ThemeProvider } from "@mui/material";
/* Styles */
import "@/styles/global.css";
import theme from "@/styles/theme";
/* Components */
import { Footer } from "@/components/footer";
import NavBar from "@/components/navBar";
import RouteLoadingOverlay from "@/components/RouteLoadingOverlay";
import PaperOverlay from "@/components/PaperOverlay";

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();

  // Auto-detect browser language on claim pages and redirect if needed.
  // Ensures foreign users scanning a Chinese QR code get English UI automatically.
  useEffect(() => {
    if (
      (router.pathname === "/claim" || router.pathname === "/claim-success") &&
      router.locale === "zh"
    ) {
      const lang = navigator.language?.toLowerCase() || "";
      if (lang && !lang.startsWith("zh")) {
        router.replace(router.asPath, router.asPath, { locale: "en" });
      }
    }
  }, [router.pathname]);

  // Prevent scroll jumps during route transitions:
  // When navigation starts, freeze the page at its current scroll position
  // by switching to fixed positioning. This stops layout shifts from
  // unmounting components (e.g. WalletCanvas/p5.js) from moving the viewport.
  // On completion, restore normal flow and scroll to top.
  useEffect(() => {
    const onStart = () => {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
    };
    const onDone = () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      window.scrollTo(0, 0);
    };
    router.events.on("routeChangeStart", onStart);
    router.events.on("routeChangeComplete", onDone);
    router.events.on("routeChangeError", onDone);
    return () => {
      router.events.off("routeChangeStart", onStart);
      router.events.off("routeChangeComplete", onDone);
      router.events.off("routeChangeError", onDone);
    };
  }, [router]);

  // iOS Safari fix: on iOS, non-button elements (a, div, span) often require
  // two taps because iOS doesn't properly synthesize click events for them.
  // This workaround intercepts touchend and manually fires click() for taps,
  // then prevents the delayed native click to avoid duplicates.
  useEffect(() => {
    const isIOS =
      typeof navigator !== "undefined" &&
      /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (!isIOS) return;

    let startX = 0;
    let startY = 0;
    let startTime = 0;

    const onTouchStart = (e: TouchEvent) => {
      const t = e.touches[0];
      startX = t.clientX;
      startY = t.clientY;
      startTime = Date.now();
    };

    const onTouchEnd = (e: TouchEvent) => {
      const t = e.changedTouches[0];
      const dx = Math.abs(t.clientX - startX);
      const dy = Math.abs(t.clientY - startY);
      const elapsed = Date.now() - startTime;

      // Only act on quick taps (not scrolls or long-presses)
      if (dx > 10 || dy > 10 || elapsed > 300) return;

      // Use composedPath to pierce shadow DOM (e.g. Beacon wallet modal),
      // falling back to e.target for normal DOM elements.
      let el = (e.composedPath?.()[0] ?? e.target) as HTMLElement;
      if (!(el instanceof HTMLElement)) {
        el = (el as any).parentElement;
      }
      if (!el || typeof el.click !== "function") return;

      // Buttons, inputs, selects, textareas already work — skip them
      const tag = el.tagName;
      if (tag === "BUTTON" || tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

      // Also skip if the tap landed inside a button (e.g. SVG icon inside button)
      if (el.closest("button, input, select, textarea")) return;

      // Fire click immediately and cancel the delayed native one
      el.click();
      e.preventDefault();
    };

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: false });

    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, []);

  let isMinimal = false;
  if (["ShowCase"].includes(Component.displayName || "")) {
    isMinimal = true;
  }

  return (
    <>
      <Head>
        <title>KAIROS</title>
        <meta name="description" content="KAIROS" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" sizes="32x32" />
        <link rel="icon" href="/logo-white.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </Head>
      <ConnectionProvider>
        <GlobalProvider>
          <UIEnvironmentProvider>
            <ThemeProvider theme={theme}>
              <CssBaseline />
              <RouteLoadingOverlay />
              <PaperOverlay />
              {!isMinimal && <NavBar />}
              {isMinimal ? (
                <Component {...pageProps} />
              ) : (
                <Box sx={{ minHeight: "calc(100vh - 200px)" }}>
                  <Component {...pageProps} />
                </Box>
              )}
              {!isMinimal && <Footer />}
            </ThemeProvider>
          </UIEnvironmentProvider>
        </GlobalProvider>
      </ConnectionProvider>
    </>
  );
}
