import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  components: {
    MuiCssBaseline: {
      styleOverrides: () => ({
        body: {
          overflowX: 'hidden',
        }
      }),
    },
  },
  palette: {
    background: {
      default: "#ecf2eb",
    },
    primary: {
      main: "#000",
    },
    secondary: {
      main: "#3035a4",
    },
  }
});

export default theme;
