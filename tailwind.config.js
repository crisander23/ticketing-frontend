/** @type {import('tailwindcss').Config} */
module.exports = {
  // Enable class-based dark mode (we toggle 'dark' on <html>)
  darkMode: 'class',

  // Purge paths (adjust if your folders differ)
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './pages/**/*.{js,jsx,ts,tsx}',
  ],

  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '1rem',
        md: '2rem',
        lg: '2rem',
        xl: '2.5rem',
        '2xl': '3rem',
      },
      screens: {
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
        '2xl': '1440px',
      },
    },
    extend: {
      // Optional: tiny tweaks you’re using across the UI
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        // subtle glass/card shadow
        'glass': 'inset 0 1px 0 rgba(255,255,255,0.08), 0 20px 60px -20px rgba(0,0,0,0.6)',
      },
    },
  },

  plugins: [
    require('@tailwindcss/forms'), // nicer inputs/selects
  ],
};
