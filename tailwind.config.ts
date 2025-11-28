import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                "deep-teal": "#006D77",
                "warm-cream": "#FDFBF7",
            },
        },
    },
    plugins: [],
    darkMode: "class",
};
export default config;
