import { Box } from "@mui/material";
import Link from "next/link";

export default function Organizer({ organizer, artists, organizers }) {
  const first_org = {};
  const second_org = {};
  const third_org = {};
  const org_frontend = organizer ? organizer.split(" x ") : [];
  // console.log("org_frontend", org_frontend);
  const org_backend = [...organizers.data, ...artists.data];
  //   console.log("org_backend", org_backend);

  if (org_frontend.length === 1) {
    org_backend.forEach((ob) => {
      if (org_frontend[0] === ob.name) {
        first_org.name = ob.name;
        first_org.wallet = ob.address;
      }
    });
  } else if (org_frontend.length === 2) {
    org_backend.forEach((ob) => {
      if (org_frontend[0] === ob.name) {
        first_org.name = ob.name;
        first_org.wallet = ob.address;
      }
      if (org_frontend[1] === ob.name) {
        second_org.name = ob.name;
        second_org.wallet = ob.address;
      }
    });
  } else if (org_frontend.length === 3) {
    org_backend.forEach((ob) => {
      if (org_frontend[0] === ob.name) {
        first_org.name = ob.name;
        first_org.wallet = ob.address;
      }
      if (org_frontend[1] === ob.name) {
        second_org.name = ob.name;
        second_org.wallet = ob.address;
      }
      if (org_frontend[2] === ob.name) {
        third_org.name = ob.name;
        third_org.wallet = ob.address;
      }
    });
  }
  //   console.log("first_org", first_org);
  //   console.log("second_org", second_org);
  //   console.log("third_org", third_org);

  return (
    <div>
      {first_org.name && (
        <Link href="/wallet/[address]" as={`/wallet/${first_org.wallet}`}>
          <Box component="span">{first_org.name}</Box>
        </Link>
      )}
      {second_org.name && (
        <>
          <span> x </span>
          <Link href="/wallet/[address]" as={`/wallet/${second_org.wallet}`}>
            <Box component="span">{second_org.name}</Box>
          </Link>
        </>
      )}
      {third_org.name && (
        <>
          <span> x </span>
          <Link href="/wallet/[address]" as={`/wallet/${third_org.wallet}`}>
            <Box component="span">{third_org.name}</Box>
          </Link>
        </>
      )}
    </div>
  );
}
