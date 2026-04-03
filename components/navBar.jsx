import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/router";
import { useConnection } from "@/packages/providers";
import { useTheme } from "@mui/material/styles";
import { useGlobalContext } from "@/contexts/GlobalContext";
import { useT } from "@/lib/i18n/useT";

import Link from "next/link";
import Image from "next/image";

import { Stack, Box } from "@mui/material";

import logo from "/public/logo.svg";

export default function NavBar() {
  const t = useT();
  const { isLanded } = useGlobalContext();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const { address, connect, disconnect } = useConnection();

  const [roleData, setRoleData] = useState(null);
  const [isLoadingRole, setLoadingRole] = useState(true);

  useEffect(() => {
    if (!address) return;
    fetch("/api/walletRoles", { method: "POST", body: address })
      .then((res) => res.json())
      .then((data) => {
        setRoleData(data);
        setLoadingRole(false);
      });
  }, [address]);

  const router = useRouter();
  const theme = useTheme();
  const { locale } = router;

  const gotohome = () => router.push("/");

  // Close menu when tapping outside
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => {
    const handleRouteChange = () => setMenuOpen(false);
    router.events.on("routeChangeStart", handleRouteChange);
    return () => router.events.off("routeChangeStart", handleRouteChange);
  }, [router]);

  const handleToggle = useCallback(() => {
    setMenuOpen((prev) => !prev);
  }, []);

  const handleItemClick = useCallback((callback) => {
    setMenuOpen(false);
    if (typeof callback === "function") callback();
  }, []);

  const hasCreatorRole = roleData?.data?.length > 0;

  const menuComponent = (
    <div ref={menuRef} className="relative">
      {/* Hamburger button */}
      <button
        onClick={handleToggle}
        aria-haspopup="true"
        aria-expanded={menuOpen}
        aria-label="menu"
        className={`
          flex items-center justify-center w-10 h-10 rounded-full
          border border-[var(--brand-secondary)] text-[var(--brand-secondary)] bg-white/20 backdrop-blur-md cursor-pointer
          [touch-action:manipulation] [-webkit-tap-highlight-color:transparent]
        `}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="4" y1="12" x2="20" y2="12" />
          <line x1="4" y1="18" x2="20" y2="18" />
        </svg>
      </button>

      {/* Dropdown */}
      {menuOpen && (
        <nav
          className="absolute top-[calc(100%+8px)] right-0 min-w-[180px]
            rounded-lg border border-[var(--brand-primary)] bg-white
            shadow-[0_4px_20px_rgba(0,0,0,0.12)] overflow-hidden"
        >
          {/* Language toggle — top of menu */}
          <div className="flex items-center gap-1 px-5 py-3 text-sm">
            <Link
              href={router.asPath}
              locale="en"
              onClick={() => handleItemClick()}
              className="no-underline font-medium"
              style={{ color: locale === "en" ? "var(--brand-secondary)" : "var(--brand-primary)", opacity: locale === "en" ? 1 : 0.4 }}
            >
              EN
            </Link>
            <span style={{ color: "var(--brand-primary)", opacity: 0.3 }}>|</span>
            <Link
              href={router.asPath}
              locale="zh"
              onClick={() => handleItemClick()}
              className="no-underline font-medium"
              style={{ color: locale === "zh" ? "var(--brand-secondary)" : "var(--brand-primary)", opacity: locale === "zh" ? 1 : 0.4 }}
            >
              中文
            </Link>
          </div>
          <div className="h-px bg-[var(--brand-primary)]/15" />

          <Link href="/" onClick={() => handleItemClick()} style={{ display: "block", padding: "12px 20px", fontSize: 14, color: "var(--brand-primary)", textDecoration: "none", fontWeight: 300 }}>
            {t.nav.home}
          </Link>
          <Link href="/events" onClick={() => handleItemClick()} style={{ display: "block", padding: "12px 20px", fontSize: 14, color: "var(--brand-primary)", textDecoration: "none", fontWeight: 300 }}>
            {t.nav.events}
          </Link>

          {address && (
            <>
              <div className="h-px bg-[var(--brand-primary)]/15" />
              <Link href={`/wallet/${address}`} onClick={() => handleItemClick()} style={{ display: "block", padding: "12px 20px", fontSize: 14, color: "var(--brand-primary)", textDecoration: "none", fontWeight: 300 }}>
                {t.nav.myWallet}
              </Link>
              {hasCreatorRole && (
                <Link href="/mint" onClick={() => handleItemClick()} style={{ display: "block", padding: "12px 20px", fontSize: 14, color: "var(--brand-primary)", textDecoration: "none", fontWeight: 300 }}>
                  {t.nav.mint}
                </Link>
              )}
              <div className="h-px bg-[var(--brand-primary)]/15" />
              <button
                onClick={() => handleItemClick(disconnect)}
                style={{ display: "flex", alignItems: "center", gap: 8, width: "100%", padding: "12px 20px", fontSize: 14, color: "var(--brand-primary)", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit", fontWeight: 300 }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                {t.common.disconnect}
              </button>
            </>
          )}
        </nav>
      )}
    </div>
  );

  return (
    <>
      <Box sx={{ height: "130px" }} />
      <Stack
        direction="row"
        justifyContent="space-between"
        padding="2rem 1.5rem"
        alignItems="center"
        sx={{
          position: "fixed",
          top: isLanded ? 0 : "-100px",
          width: "100%",
          zIndex: theme.zIndex.navBar,
          transition: "top .5s",
        }}
      >
        <Box
          onClick={gotohome}
          sx={{
            cursor: "pointer",
            position: "relative",
            width: { xs: "60px", sm: "60px", md: "60px" },
            height: { xs: "30px", sm: "30px", md: "30px" },
            transition: "width .5s, height .5s",
          }}
        >
          <Image
            src={logo}
            alt="Kairos"
            onClick={gotohome}
            width="100"
            height="100"
            style={{ width: "100%", height: "auto" }}
            fetchpriority="high"
          />
        </Box>
        <Box>
          <Stack direction="row" alignItems="center" spacing={2}>
            {router.pathname !== "/claim" && !address && (
              <button
                onClick={connect}
                className={`
                  flex items-center gap-1.5 px-4 py-2 rounded-full
                  border border-[var(--brand-primary)] text-[var(--brand-primary)] bg-white/20 backdrop-blur-md
                  text-sm font-medium cursor-pointer
                  [touch-action:manipulation] [-webkit-tap-highlight-color:transparent]
                `}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                {t.common.connect}
              </button>
            )}
            {router.pathname !== "/claim" && menuComponent}
          </Stack>
        </Box>
      </Stack>
    </>
  );
}
