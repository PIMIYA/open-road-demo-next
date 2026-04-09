/**
 * Lightweight hamburger menu for the map page (top-right).
 * Connect wallet + language toggle + navigation links.
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useConnection } from "@/packages/providers";
import { useT } from "@/lib/i18n/useT";
import { truncateAddress } from "@/lib/stringUtils";

export default function MapMenu() {
  const t = useT();
  const router = useRouter();
  const { locale } = router;
  const { address, connect, disconnect } = useConnection();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Close on route change
  useEffect(() => {
    const onRoute = () => setMenuOpen(false);
    router.events.on("routeChangeStart", onRoute);
    return () => router.events.off("routeChangeStart", onRoute);
  }, [router]);

  const close = useCallback((cb) => {
    setMenuOpen(false);
    if (typeof cb === "function") cb();
  }, []);

  return (
    <div
      ref={menuRef}
      style={{ position: "absolute", top: "1.25rem", right: "1.25rem", zIndex: 50 }}
      onPointerDown={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Hamburger button */}
      <button
        onClick={() => setMenuOpen((v) => !v)}
        aria-label="menu"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 40,
          height: 40,
          borderRadius: "50%",
          border: "1px solid var(--brand-secondary)",
          color: "var(--brand-secondary)",
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(4px)",
          cursor: "pointer",
          padding: 0,
        }}
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
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            right: 0,
            minWidth: 180,
            borderRadius: 8,
            border: "1px solid var(--brand-primary)",
            background: "#fff",
            boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
            overflow: "hidden",
          }}
        >
          {/* Language toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "12px 20px", fontSize: 14 }}>
            <Link href={router.asPath} locale="en" onClick={() => close()} style={{ textDecoration: "none", fontWeight: 500, color: locale === "en" ? "var(--brand-secondary)" : "var(--brand-primary)", opacity: locale === "en" ? 1 : 0.4 }}>
              EN
            </Link>
            <span style={{ color: "var(--brand-primary)", opacity: 0.3 }}>|</span>
            <Link href={router.asPath} locale="zh" onClick={() => close()} style={{ textDecoration: "none", fontWeight: 500, color: locale === "zh" ? "var(--brand-secondary)" : "var(--brand-primary)", opacity: locale === "zh" ? 1 : 0.4 }}>
              中文
            </Link>
          </div>
          <div style={{ height: 1, background: "rgba(36,131,255,0.15)" }} />

          {/* Nav links */}
          <Link href="/events" onClick={() => close()} style={{ display: "block", padding: "12px 20px", fontSize: 14, color: "var(--brand-primary)", textDecoration: "none", fontWeight: 300 }}>
            {t.nav.events}
          </Link>

          {/* Connect / Wallet */}
          {!address ? (
            <button
              onClick={() => close(() => connect())}
              style={{ display: "block", width: "100%", padding: "12px 20px", fontSize: 14, color: "var(--brand-secondary)", background: "transparent", border: "none", cursor: "pointer", textAlign: "left", fontFamily: "inherit", fontWeight: 500 }}
            >
              {t.common.connect}
            </button>
          ) : (
            <>
              <div style={{ height: 1, background: "rgba(36,131,255,0.15)" }} />
              <Link href={`/wallet/${address}`} onClick={() => close()} style={{ display: "block", padding: "12px 20px", fontSize: 14, color: "var(--brand-primary)", textDecoration: "none", fontWeight: 300 }}>
                {t.nav.myWallet}
              </Link>
              <div style={{ height: 1, background: "rgba(36,131,255,0.15)" }} />
              <button
                onClick={() => close(disconnect)}
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
}
