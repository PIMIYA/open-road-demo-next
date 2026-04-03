import Chip from "@mui/material/Chip";

export default function Tags({ tags }) {
  return (
    <>
      {tags &&
        tags.map((tag, index) => (
          <Chip
            key={index}
            label={tag}
            variant="outlined"
            size="small"
            sx={{
              mr: 1,
              mb: 1,
              cursor: "default",
            }}
          />
        ))}
    </>
  );
}
