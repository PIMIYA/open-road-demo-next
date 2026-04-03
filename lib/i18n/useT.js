import { useRouter } from "next/router";
import { getT } from "./getT";

/**
 * Returns the translation object for the current locale.
 * Usage: const t = useT();  then t.nav.home, t.claim.success, etc.
 */
export function useT() {
  const { locale } = useRouter();
  return getT(locale);
}

// Re-export getT for convenience
export { getT };
