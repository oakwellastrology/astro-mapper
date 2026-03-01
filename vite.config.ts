import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [tailwindcss(), sveltekit()],
	optimizeDeps: {
		exclude: ['sweph-wasm'],
	},
	server: {
		sourcemapIgnoreList: (sourcePath) => sourcePath.includes('node_modules'),
	},
	test: {
		setupFiles: ['src/tests/setup-wasm.ts'],
	},
});
