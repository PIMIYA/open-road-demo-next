import Paper from '@mui/material/Paper';

export default function SidePaper(props) {
  return (
    <Paper sx={{
      padding: 2,
      boxShadow: 0,
      marginBottom: 4,
    }}>
      {props.children}
    </Paper>
  );
}
