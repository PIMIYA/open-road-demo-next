import Link from "next/link";
import { useRouter } from "next/router";

/**
 * Standalone EN | 中文 toggle for pages without NavBar (e.g. homepage).
 * Positioned absolute top-right by default.
 */
export default function LanguageToggle({ style = {} }) {
  const router = useRouter();
  const { locale } = router;

  return (
    <div
      style={{
        position: "absolute",
        top: 16,
        right: 60,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        gap: 4,
        fontSize: 12,
        fontWeight: 500,
        letterSpacing: "0.05em",
        ...style,
      }}
    >
      <Link
        href={router.asPath}
        locale="en"
        style={{
          textDecoration: "none",
          color: locale === "en" ? "var(--brand-secondary)" : "var(--brand-primary)",
          opacity: locale === "en" ? 1 : 0.4,
        }}
      >
        EN
      </Link>
      <span style={{ color: "var(--brand-primary)", opacity: 0.3 }}>|</span>
      <Link
        href={router.asPath}
        locale="zh"
        style={{
          textDecoration: "none",
          color: locale === "zh" ? "var(--brand-secondary)" : "var(--brand-primary)",
          opacity: locale === "zh" ? 1 : 0.4,
        }}
      >
        中文
      </Link>
    </div>
  );
}
