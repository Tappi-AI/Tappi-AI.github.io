/** @type {import('tailwindcss').Config} */
export default {
	darkMode: 'class', // 👈 important
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				// optional: nice dark palette
				dark: {
					bg: '#0f172a', // slate-900
					card: '#020617', // slate-950
					border: '#1e293b' // slate-800
				}
			}
		}
	},
	plugins: []
};
