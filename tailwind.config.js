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
          primary: '#2563EB',
          'primary-dark': '#1E40AF',
          'primary-light': '#DBEAFE',
          background: '#F8FAFC',
          surface: '#FFFFFF',
          'surface-elevated': '#FFFFFF',
          text: '#0F172A',
          'text-secondary': '#64748B',
          success: '#10B981',
          warning: '#F97316',
          error: '#DC2626',
          accent: '#F97316',
          border: '#E2E8F0',
          subtle: '#F1F5F9',
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
