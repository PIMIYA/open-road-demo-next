import Chip from "@mui/material/Chip";
import { useRouter } from "next/router";

export default function ({ tags }) {
  const router = useRouter();
  return (
    <>
      {tags &&
        tags.map((tag, index) => (
          <Chip
            key={index}
            label={tag}
            size="small"
            sx={{
              mr: 1,
              mb: 1,
            }}
            onClick={() => {
              router.push({
                pathname: "/events",
                query: { tag: tag },
              });
            }}
          />
        ))}
    </>
  );
}
