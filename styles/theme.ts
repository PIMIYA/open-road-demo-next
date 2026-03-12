import { PaletteOptions, ZIndex, createTheme } from '@mui/material/styles';
import { TypographyOptions } from '@mui/material/styles/createTypography';

// Brand colors from new client design system
const brandColors = {
  primary: '#2483ff',
  secondary: '#ed5024',
  background: '#f5f5f5',
  muted: '#D8D4CC',
  success: '#25e56b',
  warning: '#fcaf28',
  error: '#ff0000',
};

// Border opacity levels (matching design-system-components)
const borderOpacity = {
  light: '33', // 20%
  medium: '66', // 40%
  heavy: '99', // 60%
};

declare module '@mui/material/styles' {
  interface Palette {
    highlight: Palette['primary'];
    brand: {
      primary: string;
      secondary: string;
      background: string;
    };
  }
  interface PaletteOptions {
    highlight?: PaletteOptions['primary'];
    brand?: {
      primary: string;
      secondary: string;
      background: string;
    };
  }
  interface TypographyVariants {
    label: React.CSSProperties;
    sectionTitle: React.CSSProperties;
    mono: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    label?: React.CSSProperties;
    sectionTitle?: React.CSSProperties;
    mono?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    cardTitle: true;
    label: true;
    sectionTitle: true;
    mono: true;
  }
}

declare module "@mui/material/Button" {
  interface ButtonPropsSizeOverrides {
    extraLarge: true;
  }
  interface ButtonPropsColorOverrides {
    brand: true;
  }
}

declare module "@mui/material/Chip" {
  interface ChipPropsColorOverrides {
    brand: true;
  }
}

const theme = createTheme({
  spacing: 4, // Base spacing unit: 4px (matching design system's 0.25rem)
  shape: {
    borderRadius: 0, // Wire-style: completely square corners
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: () => ({
        html: {
          fontSize: '14px', // Base font size from design system
        },
        body: {
          overflowX: 'hidden',
          fontWeight: 300, // Light weight as default
        },
        ':root': {
          '--brand-primary': brandColors.primary,
          '--brand-secondary': brandColors.secondary,
          '--brand-bg': brandColors.background,
        },
      }),
    },
    MuiDivider: {
      styleOverrides: {
        root: {
          borderColor: `${brandColors.primary}${borderOpacity.light}`,
        },
      },
    },
    MuiPopover: {
      styleOverrides: {
        paper: {
          marginTop: '0.5rem',
          boxShadow: 'none',
          border: `1px solid ${brandColors.primary}${borderOpacity.light}`,
          borderRadius: 0,
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        paper: {
          backgroundColor: '#ffffff',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: 'transparent',
        },
        outlined: {
          borderColor: `${brandColors.primary}${borderOpacity.light}`,
        },
      },
    },
    MuiTypography: {
      defaultProps: {
        variantMapping: {
          label: 'span',
          sectionTitle: 'h2',
          mono: 'span',
        },
      },
      variants: [
        {
          props: { variant: 'cardTitle' },
          style: {
            fontSize: '1.2rem',
            lineHeight: '1.3',
            fontWeight: 400,
            marginBottom: 0,
          },
        },
      ],
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          cursor: 'pointer',
          fontWeight: 400,
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          height: '24px',
        },
        outlined: {
          borderColor: `${brandColors.primary}${borderOpacity.medium}`,
          color: brandColors.primary,
          '&:hover': {
            backgroundColor: `${brandColors.primary}0D`,
            borderColor: brandColors.primary,
          },
        },
        filled: {
          backgroundColor: brandColors.primary,
          color: brandColors.background,
          '&:hover': {
            backgroundColor: brandColors.secondary,
          },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        disableRipple: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 0,
          textTransform: 'uppercase',
          fontWeight: 400,
          fontSize: '11px',
          letterSpacing: '0.05em',
          boxShadow: 'none',
          minHeight: '36px',
          padding: '8px 16px',
          transition: 'all 0.15s ease',
          '&:hover': {
            boxShadow: 'none',
          },
        },
        contained: {
          backgroundColor: brandColors.primary,
          color: brandColors.background,
          '&:hover': {
            backgroundColor: brandColors.secondary,
            color: brandColors.background,
          },
        },
        outlined: {
          borderWidth: '1px',
          borderColor: `${brandColors.primary}${borderOpacity.medium}`,
          color: brandColors.primary,
          backgroundColor: 'transparent',
          '&:hover': {
            borderWidth: '1px',
            borderColor: brandColors.primary,
            backgroundColor: `${brandColors.primary}0D`,
          },
        },
        text: {
          color: brandColors.primary,
          '&:hover': {
            backgroundColor: `${brandColors.primary}0D`,
          },
        },
        sizeSmall: {
          fontSize: '10px',
          minHeight: '32px',
          padding: '6px 12px',
        },
        sizeLarge: {
          fontSize: '12px',
          minHeight: '40px',
          padding: '10px 24px',
        },
      },
      variants: [
        {
          props: { size: "extraLarge" },
          style: {
            fontSize: '14px',
            minHeight: '48px',
            padding: '12px 32px',
          },
        },
        {
          props: { color: "brand" },
          style: {
            color: brandColors.primary,
            borderColor: brandColors.primary,
            '&:hover': {
              borderColor: brandColors.secondary,
              backgroundColor: `${brandColors.secondary}1A`,
            },
          },
        },
      ],
    },
    MuiTextField: {
      defaultProps: {
        variant: 'outlined',
        size: 'small',
      },
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 0,
            fontSize: '14px',
            fontWeight: 300,
            '& fieldset': {
              borderColor: `${brandColors.primary}${borderOpacity.medium}`,
              borderWidth: '1px',
            },
            '&:hover fieldset': {
              borderColor: brandColors.primary,
            },
            '&.Mui-focused fieldset': {
              borderColor: brandColors.primary,
              borderWidth: '1px',
            },
          },
          '& .MuiInputLabel-root': {
            fontSize: '10px',
            textTransform: 'uppercase',
            letterSpacing: '0.2em',
            color: `${brandColors.primary}99`,
            fontWeight: 400,
            '&.Mui-focused': {
              color: brandColors.primary,
            },
          },
          '& .MuiInputBase-input::placeholder': {
            color: `${brandColors.primary}4D`,
            opacity: 1,
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          fontWeight: 400,
        },
      },
    },
    MuiFormLabel: {
      styleOverrides: {
        root: {
          fontSize: '10px',
          textTransform: 'uppercase',
          letterSpacing: '0.2em',
          fontWeight: 400,
          color: `${brandColors.primary}99`,
        },
      },
    },
    MuiSelect: {
      defaultProps: {
        size: 'small',
      },
      styleOverrides: {
        root: {
          borderRadius: 0,
          '& .MuiOutlinedInput-notchedOutline': {
            borderColor: `${brandColors.primary}${borderOpacity.medium}`,
            borderWidth: '1px',
          },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: brandColors.primary,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: brandColors.primary,
            borderWidth: '1px',
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          fontSize: '12px',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          '&:hover': {
            backgroundColor: `${brandColors.primary}0D`,
          },
          '&.Mui-selected': {
            backgroundColor: `${brandColors.primary}1A`,
            '&:hover': {
              backgroundColor: `${brandColors.primary}26`,
            },
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          border: `1px solid ${brandColors.primary}${borderOpacity.light}`,
          boxShadow: 'none',
          backgroundColor: 'transparent',
          transition: 'border-color 0.15s ease',
          '&:hover': {
            borderColor: `${brandColors.primary}${borderOpacity.medium}`,
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          padding: '24px',
          '&:last-child': {
            paddingBottom: '24px',
          },
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: 'none',
          backgroundColor: 'transparent',
          '&:before': {
            display: 'none',
          },
          '&.Mui-expanded': {
            margin: 0,
          },
        },
      },
    },
    MuiAccordionSummary: {
      styleOverrides: {
        root: {
          padding: '0',
          minHeight: 'auto',
          borderBottom: `1px solid ${brandColors.primary}${borderOpacity.light}`,
          '&.Mui-expanded': {
            minHeight: 'auto',
          },
        },
        content: {
          margin: '16px 0',
          '&.Mui-expanded': {
            margin: '16px 0',
          },
        },
      },
    },
    MuiAccordionDetails: {
      styleOverrides: {
        root: {
          padding: '16px 0',
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: `${brandColors.primary}${borderOpacity.medium}`,
          padding: '4px',
          '&.Mui-checked': {
            color: brandColors.secondary,
          },
          '& .MuiSvgIcon-root': {
            fontSize: '18px',
          },
        },
      },
    },
    MuiRadio: {
      styleOverrides: {
        root: {
          color: `${brandColors.primary}${borderOpacity.medium}`,
          padding: '4px',
          '&.Mui-checked': {
            color: brandColors.primary,
          },
          '& .MuiSvgIcon-root': {
            fontSize: '18px',
          },
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 42,
          height: 24,
          padding: 0,
        },
        switchBase: {
          padding: 2,
          '&.Mui-checked': {
            transform: 'translateX(18px)',
            color: brandColors.background,
            '& + .MuiSwitch-track': {
              backgroundColor: brandColors.secondary,
              opacity: 1,
            },
          },
        },
        thumb: {
          width: 20,
          height: 20,
          boxShadow: 'none',
        },
        track: {
          borderRadius: 0,
          backgroundColor: brandColors.muted,
          opacity: 1,
        },
      },
    },
    MuiSlider: {
      styleOverrides: {
        root: {
          height: 2,
          color: brandColors.primary,
        },
        thumb: {
          width: 12,
          height: 12,
          backgroundColor: brandColors.primary,
          '&:hover, &.Mui-focusVisible': {
            boxShadow: 'none',
          },
        },
        track: {
          height: 2,
          border: 'none',
        },
        rail: {
          height: 2,
          backgroundColor: `${brandColors.primary}${borderOpacity.light}`,
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 2,
          borderRadius: 0,
          backgroundColor: `${brandColors.primary}${borderOpacity.light}`,
        },
        bar: {
          borderRadius: 0,
          backgroundColor: brandColors.primary,
        },
      },
    },
  },
  typography: {
    fontFamily: 'ui-sans-serif, system-ui, sans-serif, "Apple Color Emoji", "Segoe UI Emoji"',
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 300,
    fontWeightMedium: 400,
    fontWeightBold: 500,
    h1: {
      fontSize: '32px',
      fontWeight: 400,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '24px',
      fontWeight: 400,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '18px',
      fontWeight: 400,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '14px',
      fontWeight: 400,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      lineHeight: 1.5,
    },
    h5: {
      fontSize: '12px',
      fontWeight: 400,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '11px',
      fontWeight: 400,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '14px',
      fontWeight: 300,
      lineHeight: 1.625,
    },
    body2: {
      fontSize: '13px',
      fontWeight: 300,
      lineHeight: 1.625,
    },
    caption: {
      fontSize: '10px',
      fontWeight: 300,
      lineHeight: 1.5,
    },
    overline: {
      fontSize: '10px',
      fontWeight: 400,
      textTransform: 'uppercase',
      letterSpacing: '0.2em',
      lineHeight: 1.5,
    },
    button: {
      fontSize: '11px',
      fontWeight: 400,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    label: {
      fontSize: '10px',
      fontWeight: 400,
      textTransform: 'uppercase',
      letterSpacing: '0.2em',
      lineHeight: 1.5,
    },
    sectionTitle: {
      fontSize: '18px',
      fontWeight: 400,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      lineHeight: 1.4,
    },
    mono: {
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      fontSize: '11px',
      fontWeight: 300,
    },
    smallest: {
      fontSize: 10,
    },
  } as TypographyOptions,
  palette: {
    background: {
      default: brandColors.background,
      paper: brandColors.background,
    },
    text: {
      primary: brandColors.primary,
      secondary: `${brandColors.primary}99`,
      disabled: `${brandColors.primary}66`,
    },
    primary: {
      main: brandColors.primary,
      contrastText: brandColors.background,
    },
    secondary: {
      main: brandColors.secondary,
      contrastText: brandColors.background,
    },
    success: {
      main: brandColors.success,
    },
    warning: {
      main: brandColors.warning,
    },
    error: {
      main: brandColors.error,
    },
    divider: `${brandColors.primary}${borderOpacity.light}`,
    action: {
      hover: `${brandColors.primary}0D`,
      selected: `${brandColors.primary}1A`,
      focus: `${brandColors.primary}1A`,
    },
    highlight: {
      main: "#ffce6e",
    },
    brand: {
      primary: brandColors.primary,
      secondary: brandColors.secondary,
      background: brandColors.background,
    },
  } as PaletteOptions,
  zIndex: {
    keyVisual: -1,
    navBar: 1000,
  } as Partial<ZIndex>,
});

export default theme;

// Export brand colors and opacity for direct use
export { brandColors, borderOpacity };
