import Paper from '@mui/material/Paper';

export default function Card(props) {
  return (
    <Paper sx={{
      padding: 2,
      boxShadow: 0,
      marginBottom: 4,
      backgroundColor: 'transparent',
    }}>
      {props.children}
    </Paper>
  );
}
