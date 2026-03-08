// vite.config.ts
/// <reference types="vitest" />

import { projectBaseWithSlash } from './myconfig.js';

import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vitest/config';
import { sveltekit } from '@sveltejs/kit/vite';

const backendUrls = {
	development: 'http://localhost:5000',
	production: 'https://example.com'
} as const;

type BackendUrlMode = keyof typeof backendUrls;

export default defineConfig(({ mode }) => {
	const safeMode = mode as BackendUrlMode;
	const backendUrl = backendUrls[safeMode] || backendUrls.production;

	const isProduction = mode === 'production';

	const allowedHosts =
		safeMode === 'development' ? ['*', 'localhost', '127.0.0.1'] : ['example.com'];

	return {
		base: isProduction ? projectBaseWithSlash : '/',

		plugins: [tailwindcss(), sveltekit()],
		server: {
			host: '0.0.0.0',
			port: 3000,
			allowedHosts
		},
		define: {
			'import.meta.env.VITE_BACKEND_URL': JSON.stringify(backendUrl)
		},
		test: {
			workspace: [
				{
					extends: './vite.config.ts',
					test: {
						name: 'client',
						environment: 'jsdom',
						clearMocks: true,
						include: ['src/**/*.svelte.{test,spec}.{js,ts}'],
						exclude: ['src/lib/server/**'],
						setupFiles: ['./vitest-setup-client.ts']
					}
				},
				{
					extends: './vite.config.ts',
					test: {
						name: 'server',
						environment: 'node',
						include: ['src/**/*.{test,spec}.{js,ts}'],
						exclude: ['src/**/*.svelte.{test,spec}.{js,ts}']
					}
				}
			]
		}
	};
});
