/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(270 20% 92%)",
        input: "hsl(270 20% 95%)",
        ring: "hsl(262 83% 58%)",
        background: "#faf8ff",
        foreground: "hsl(262 47% 11%)",
        primary: {
          DEFAULT: "hsl(262 83% 58%)",
          foreground: "#fff",
        },
        secondary: {
          DEFAULT: "hsl(270 30% 96%)",
          foreground: "hsl(262 47% 34%)",
        },
        destructive: "hsl(0 84% 60%)",
        "destructive-foreground": "#fff",
        muted: {
          DEFAULT: "hsl(270 20% 97%)",
          foreground: "hsl(262 10% 50%)",
        },
        accent: {
          DEFAULT: "hsl(270 25% 92%)",
          foreground: "hsl(262 47% 34%)",
        },
        popover: {
          DEFAULT: "#fff",
          foreground: "hsl(262 47% 11%)",
        },
        card: {
          DEFAULT: "#fff",
          foreground: "hsl(262 47% 11%)",
        },
        sidebar: {
          DEFAULT: "#fff",
          foreground: "hsl(262 47% 11%)",
          border: "hsl(270 20% 94%)",
          "primary": "hsl(262 83% 58%)",
          "primary-foreground": "#fff",
          accent: "hsl(270 25% 96%)",
          "accent-foreground": "hsl(262 47% 34%)",
        },
      },
      borderRadius: {
        lg: "0.75rem",
        md: "calc(0.75rem - 2px)",
        sm: "calc(0.75rem - 4px)",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
