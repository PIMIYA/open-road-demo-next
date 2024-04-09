import { createTheme } from '@mui/material/styles';

import { TypographyProps } from '@mui/material/Typography';

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    cardTitle: true;
  }
}

const theme = createTheme({
  components: {
    MuiCssBaseline: {
      styleOverrides: () => ({
        body: {
          overflowX: 'hidden',
        }
      }),
    },
    MuiTypography: {
      variants: [
        {
          props: { variant: 'cardTitle' },
          style: {
            fontSize: '1.2rem',
            lineHeight: '1.3',
            fontWeight: 'bold',
            // marginBottom: '.5rem',
          },
        },
      ],
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
  },
});

export default theme;
