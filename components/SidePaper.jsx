import Paper from '@mui/material/Paper';

export default function SidePaper(props) {
  return (
    <Paper sx={{
      boxShadow: 0,
      marginBottom: 4,
      backgroundColor: 'transparent',
      maxWidth: { xs: 300,  lg: '100%' },
    }}>
      {props.children}
    </Paper>
  );
}
