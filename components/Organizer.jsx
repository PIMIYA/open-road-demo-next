import { Box, Typography } from "@mui/material";
import Link from "next/link";

export default function Organizer({ organizer, artists, organizers }) {
  if (!organizer) return null;

  const normalize = (s) => s.replace(/\s+/g, "").toLowerCase();

  const names = organizer.split(" x ").map((n) => n.trim()).filter(Boolean);
  const artistList = (artists?.data || []);
  const organizerList = (organizers?.data || []);
  const allPeople = [...organizerList, ...artistList];

  const artistNorm = new Set(artistList.map((a) => normalize(a.name)));
  const organizerNorm = new Set(organizerList.map((o) => normalize(o.name)));

  const resolve = (name) => {
    const match = allPeople.find((p) => normalize(p.name) === normalize(name));
    return match ? { name: match.name, wallet: match.address } : { name, wallet: null };
  };

  const grouped = { artist: [], organizer: [] };
  names.forEach((name) => {
    const person = resolve(name);
    const norm = normalize(name);
    if (artistNorm.has(norm)) {
      grouped.artist.push(person);
    } else if (organizerNorm.has(norm)) {
      grouped.organizer.push(person);
    } else {
      // fallback: treat as organizer (unknown names are more likely organizers)
      grouped.organizer.push(person);
    }
  });

  const renderNames = (people) =>
    people.map((person, i) => (
      <span key={person.name}>
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

  return (
    <div>
      {grouped.artist.length > 0 && (
        <Box>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            藝術家
          </Typography>
          <Box sx={{ fontSize: "inherit" }}>{renderNames(grouped.artist)}</Box>
        </Box>
      )}
      {grouped.organizer.length > 0 && (
        <Box sx={{ mt: grouped.artist.length > 0 ? 0.5 : 0 }}>
          <Typography variant="caption" sx={{ opacity: 0.8 }}>
            主辦方
          </Typography>
          <Box sx={{ fontSize: "inherit" }}>{renderNames(grouped.organizer)}</Box>
        </Box>
      )}
    </div>
  );
}
