import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
	content: [
		"./index.html",
		"./src/**/*.{js,ts,jsx,tsx}",
		"./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
	],
	theme: {
		extend: {
			colors: {
				beamly: {
					primary: "#0F43EE",
					secondary: "#FCE90D",
					third: "#011241"
				}
			}
		},
	},
	darkMode: "class",
	plugins: [heroui()],
};