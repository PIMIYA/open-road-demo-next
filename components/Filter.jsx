import { Autocomplete, Box, Button, TextField, Typography } from '@mui/material';

const categories = [
  { label: "Performance" },
  { label: "Exhibition" },
  { label: "Concert" },
  { label: "Festival" },
  { label: "Other" },
];

const tags = [
  { main: "Visual", sub: "Painting" },
  { main: "Visual", sub: "Installation" },
  { main: "Visual", sub: "Sculpture" },
  { main: "Visual", sub: "Photography" },
  { main: "Performance", sub: "Circus" },
  { main: "Performance", sub: "Musical" },
  { main: "Design", sub: "Interactive" },
  { main: "Design", sub: "Graphic" },
];

export default function Filter() {
  function FormField(props) {
    return (
      <Box sx={{
        mb: 1,
      }}>
        {props.children}
      </Box>
    );
  }
  return (
    <Box>
      <Typography gutterBottom>Filter</Typography>
      <Box
        component="form"
      >
        <FormField>
          <Autocomplete
            id="category"
            options={categories}
            getOptionLabel={(option) => option.label}
            renderInput={(params) => (
              <TextField {...params} label="Category" variant="standard" />
            )}
          />
        </FormField>
        <FormField>
          <Autocomplete
            multiple
            id="tag"
            options={tags}
            groupBy={(option) => option.main}
            getOptionLabel={(option) => option.sub}
            renderInput={(params) => (
              <TextField {...params} label="Tag" variant="standard" />
            )}
          />
        </FormField>
        <Box mt={4}>
          <Button variant="contained" color="primary" size="small">Apply</Button>
        </Box>
      </Box>
    </Box>
  );
}
