import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        instagram: {
          orange: "#f09433",
          pink: "#bc1888",
          purple: "#833ab4",
          red: "#fd1d1d",
          yellow: "#fcb045",
          blue: "#0095f6",
          hoverBlue: "#1877f2",
          darkBg: "#000000",
          lightBg: "#ffffff",
          grayBorder: "#dbdbdb",
          darkBorder: "#262626",
          darkCard: "#121212",
        },
        facebook: {
          blue: "#1877F2",
          hoverBlue: "#166fe5",
          bg: "#F0F2F5",
          card: "#FFFFFF",
          textPrimary: "#050505",
          textSecondary: "#65676B",
          border: "#CED0D4",
          activeBg: "#E7F3FF",
          darkBg: "#18191A",
          darkCard: "#242526",
          darkTextPrimary: "#E4E6EB",
          darkTextSecondary: "#B0B3B8",
          darkBorder: "#3E4042",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          "Helvetica",
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};

export default config;
