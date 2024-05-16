import Chip from '@mui/material/Chip';

export default function({ tags }) {
  return (
    <>
      {tags && tags.map((tag, index) => (
        <Chip key={index} label={tag} size="small" sx={{
          mr: 1,
          mb: 1,
        }} />
      ))}
    </>
  );
}
