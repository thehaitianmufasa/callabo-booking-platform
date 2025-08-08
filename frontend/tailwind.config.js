/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'callabo-black': '#000000',
        'callabo-gray': '#F5F5F5',
        'callabo-gray-dark': '#E0E0E0',
        'callabo-gray-text': '#666666',
      },
      borderRadius: {
        'callabo': '20px',
        'callabo-lg': '30px',
      },
      boxShadow: {
        'callabo': '0 10px 30px rgba(0,0,0,0.1)',
        'callabo-lg': '0 10px 30px rgba(0,0,0,0.3)',
      },
      fontFamily: {
        'system': ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
}