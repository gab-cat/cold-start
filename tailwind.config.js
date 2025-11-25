/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
    "./screens/**/*.{js,jsx,ts,tsx}",
    "./utils/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        wise: {
          primary: '#00B9A8',
          'primary-dark': '#008B82',
          'primary-light': '#E6FAF8',
          background: '#FAFBFC',
          surface: '#FFFFFF',
          'surface-elevated': '#FFFFFF',
          text: '#1A1A2E',
          'text-secondary': '#6B7280',
          success: '#10B981',
          warning: '#F59E0B',
          error: '#EF4444',
          accent: '#FF6B6B',
          border: '#E5E7EB',
          subtle: '#F3F4F6',
        },
      },
      borderRadius: {
        'wise-sm': '8px',
        'wise-md': '12px',
        'wise-lg': '16px',
        'wise-xl': '24px',
      },
    },
  },
  plugins: [],
};
