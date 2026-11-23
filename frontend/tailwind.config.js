/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    container: { center: true, padding: "1rem" },
    extend: {
      fontFamily: {
        display: ["Outfit", "system-ui", "sans-serif"],
        body: ["Manrope", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Menlo", "monospace"],
      },
      colors: {
        /* Existing semantic amber/rose utilities now render as neon lime/pink. */
        amber: { 50: "#fffaf0", 100: "#f8efd8", 200: "#efdfb7", 300: "#e5ce98", 400: "#d8ba78", 500: "#c3a15c", 600: "#a98243", 700: "#866437", 800: "#654c2e", 900: "#443526", 950: "#241d17" },
        rose: { 50: "#fff0f9", 100: "#ffe0f2", 200: "#ffb5e0", 300: "#ff88cc", 400: "#ff59b4", 500: "#ff319f", 600: "#e51588", 700: "#ad1369", 800: "#76124c", 900: "#4b1032", 950: "#270a1c" },
        sky: { 50: "#f0f6fc", 100: "#dce9f6", 200: "#c0d5eb", 300: "#9ebbd8", 400: "#7da3c5", 500: "#6189ad", 600: "#4b6d8e", 700: "#3b566f", 800: "#2c4051", 900: "#1e2b37", 950: "#111a22" },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        obsidian: "#050507",
        surface: "#0b0d11",
        elevated: "#12161b",
        hairline: "#292d34",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": { from: { height: "0" }, to: { height: "var(--radix-accordion-content-height)" } },
        "accordion-up": { from: { height: "var(--radix-accordion-content-height)" }, to: { height: "0" } },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
