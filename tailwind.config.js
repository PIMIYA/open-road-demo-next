/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './contexts/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  // MUI compatibility: use #__next as important selector
  important: '#__next',
  theme: {
    extend: {
      colors: {
        'brand-primary': '#2483ff',
        'brand-secondary': '#ed5024',
        'brand-bg': '#f9f3e6',
        'brand-muted': '#D8D4CC',
      },
    },
  },
  // Disable preflight to avoid conflicts with MUI's CssBaseline
  corePlugins: {
    preflight: false,
  },
  plugins: [],
};
