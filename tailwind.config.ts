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
        youtube: {
          red: "#FF0000",
          hoverRed: "#CC0000",
          darkRed: "#990000",
          bg: "#F9F9F9",
          card: "#FFFFFF",
          textPrimary: "#0F0F0F",
          textSecondary: "#606060",
          border: "#E5E5E5",
          darkBg: "#0F0F0F",
          darkCard: "#212121",
          darkTextPrimary: "#FFFFFF",
          darkTextSecondary: "#AAAAAA",
          darkBorder: "#303030",
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
