import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./store/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "bg-app": "#F4F4F5",
        "bg-surface": "#FFFFFF",
        "text-primary": "#18181B",
        "text-secondary": "#71717A",
        "brand-dark": "#1A1A1A",
        "accent-orange": "#F1633B",
        "accent-orange-tint": "#FDE6DA",
        success: "#16A34A",
        "success-bg": "#DCFCE7",
        warning: "#D97706",
        "warning-bg": "#FEF3C7",
        danger: "#DC2626",
        "danger-bg": "#FEE2E2",
        "border-neutral": "#E4E4E7",
        "gold-ring": "#EAB308",
      },
      borderRadius: {
        pill: "9999px",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
