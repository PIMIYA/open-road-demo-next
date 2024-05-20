import { PaletteOptions, ZIndex, createTheme } from '@mui/material/styles';
import { TypographyOptions } from '@mui/material/styles/createTypography';

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    cardTitle: true;
  }
}

declare module "@mui/material/Button" {
  interface ButtonPropsSizeOverrides {
    extraLarge: true;
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
    MuiPopover: {
      styleOverrides: {
        paper: {
          marginTop: '.5rem',
          boxShadow: 'none',
          border: '1px solid #ccc',
        },
      },
    },
    MuiTypography: {
      variants: [
        {
          props: { variant: 'cardTitle' },
          style: {
            fontSize: '1.2rem',
            lineHeight: '1.3',
            fontWeight: 'bold',
            marginBottom: 0,
          },
        },
      ],
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: '.2rem',
          cursor: 'pointer',
          '&:hover': {
            background: '#ffce6e',
          }
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: '20px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          }
        },
      },
      variants: [
        {
          props: { size: "extraLarge" },
          style: {
            fontSize: 30,
            borderRadius: 50,
            padding: '10px 30px',
          }
        }
      ]
    },
  },
  typography: {
    smallest: {
      fontSize: 10,
    },
  } as TypographyOptions,
  palette: {
    background: {
      default: "#ffefe9",
    },
    primary: {
      main: "#000",
    },
    secondary: {
      main: "#3035a4",
    },
    highlight: {
      main: "#ffce6e",
    },
  } as PaletteOptions,
  zIndex: {
    keyVisual: -1,
    navBar: 1000,
  } as Partial<ZIndex>,
});

export default theme;
