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
        amber: { 50: "#f6ffe7", 100: "#e9ffc4", 200: "#dcffa1", 300: "#caff74", 400: "#b6ff45", 500: "#a6f52b", 600: "#83cf18", 700: "#5e9e16", 800: "#416d18", 900: "#294714", 950: "#152607" },
        rose: { 50: "#fff0f9", 100: "#ffe0f2", 200: "#ffb5e0", 300: "#ff88cc", 400: "#ff59b4", 500: "#ff319f", 600: "#e51588", 700: "#ad1369", 800: "#76124c", 900: "#4b1032", 950: "#270a1c" },
        sky: { 50: "#e8fdff", 100: "#c5faff", 200: "#98f6ff", 300: "#62eeff", 400: "#22e4fa", 500: "#00cfe8", 600: "#04a9c5", 700: "#0a8198", 800: "#0d596b", 900: "#103c48", 950: "#09232b" },
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
