import { Box, Typography } from "@mui/material";
import Link from "next/link";
import { useT } from "@/lib/i18n/useT";
import { useRouter } from "next/router";
import { truncateAddress } from "@/lib/stringUtils";

export default function Organizer({ organizer, creators, artists, organizers }) {
  const t = useT();
  const { locale } = useRouter();
  const isEn = locale === "en";

  const artistList = (artists?.data || []);
  const organizerList = (organizers?.data || []);

  // Separate lookup tables: creators resolve from artists, organizers resolve from organizers
  const artistByAddress = new Map();
  for (const p of artistList) {
    if (p.address) artistByAddress.set(p.address, p);
  }

  const organizerByAddress = new Map();
  for (const p of organizerList) {
    if (p.address) organizerByAddress.set(p.address, p);
  }

  // Fallback: combined lookup for legacy string-based organizer names
  const allPeople = [...organizerList, ...artistList];

  const resolveName = (p) => isEn ? (p.name_en || p.name) : p.name;

  const resolveByName = (name) => {
    const normalize = (s) => s.replace(/\s+/g, "").toLowerCase();
    const match = allPeople.find((p) => normalize(p.name) === normalize(name));
    return match ? { name: resolveName(match), wallet: match.address } : { name, wallet: null };
  };

  const resolveCreatorByAddress = (addr) => {
    const match = artistByAddress.get(addr);
    return match
      ? { name: resolveName(match), wallet: match.address }
      : { name: truncateAddress(addr), wallet: addr };
  };

  const resolveOrganizerByAddress = (addr) => {
    const match = organizerByAddress.get(addr);
    return match
      ? { name: resolveName(match), wallet: match.address }
      : { name: truncateAddress(addr), wallet: addr };
  };

  // --- Resolve organizer ---
  const resolvedOrganizers = (() => {
    if (!organizer) return [];
    if (Array.isArray(organizer)) {
      // New format: array of wallet addresses — resolve from Directus organizers
      return organizer.map(resolveOrganizerByAddress);
    }
    // Legacy format: string — take only the first part before " x "
    const firstPart = organizer.split(" x ")[0]?.trim();
    if (!firstPart) return [];
    return [resolveByName(firstPart)];
  })();

  // --- Resolve creators ---
  const resolvedCreators = (() => {
    if (!Array.isArray(creators) || creators.length === 0) return [];
    // Resolve from Directus artists
    return creators.map(resolveCreatorByAddress);
  })();

  const renderNames = (people) =>
    people.map((person, i) => (
      <span key={person.wallet || person.name}>
        {i > 0 && ", "}
        {person.wallet ? (
          <Link href="/wallet/[address]" as={`/wallet/${person.wallet}`}>
            <Box component="span">{person.name}</Box>
          </Link>
        ) : (
          <Box component="span">{person.name}</Box>
        )}
      </span>
    ));

  if (resolvedOrganizers.length === 0 && resolvedCreators.length === 0) return null;

  return (
    <div>
      {resolvedCreators.length > 0 && (
        <Box>
          <Typography variant="caption" sx={{ opacity: 0.8, display: "block", lineHeight: 1.2 }}>
            {t.role.artist}
          </Typography>
          <Box sx={{ fontSize: "inherit", fontWeight: 300 }}>{renderNames(resolvedCreators)}</Box>
        </Box>
      )}
      {resolvedOrganizers.length > 0 && (
        <Box sx={{ mt: resolvedCreators.length > 0 ? 0.5 : 0 }}>
          <Typography variant="caption" sx={{ opacity: 0.8, display: "block", lineHeight: 1.2 }}>
            {t.role.organizer}
          </Typography>
          <Box sx={{ fontSize: "inherit", fontWeight: 300 }}>{renderNames(resolvedOrganizers)}</Box>
        </Box>
      )}
    </div>
  );
}
