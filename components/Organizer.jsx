import { Box, Typography } from "@mui/material";
import Link from "next/link";

export default function Organizer({ organizer, artists, organizers }) {
  if (!organizer) return null;

  const names = organizer.split(" x ").map((n) => n.trim()).filter(Boolean);
  const artistSet = new Set((artists?.data || []).map((a) => a.name));
  const organizerSet = new Set((organizers?.data || []).map((o) => o.name));
  const allPeople = [...(organizers?.data || []), ...(artists?.data || [])];

  const resolve = (name) => {
    const match = allPeople.find((p) => p.name === name);
    return match ? { name, wallet: match.address } : { name, wallet: null };
  };

  const grouped = { artist: [], organizer: [] };
  names.forEach((name) => {
    const person = resolve(name);
    if (artistSet.has(name)) {
      grouped.artist.push(person);
    } else if (organizerSet.has(name)) {
      grouped.organizer.push(person);
    } else {
      // fallback: treat as artist
      grouped.artist.push(person);
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
