import { readFileSync } from 'node:fs';

// Polyfill fetch for file:// URLs so sweph-wasm can load its .wasm binary in Node.js/Vitest.
const origFetch = globalThis.fetch;
globalThis.fetch = async function (input: RequestInfo | URL, init?: RequestInit) {
	const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
	if (url.startsWith('file://')) {
		const filePath = new URL(url).pathname;
		const buffer = readFileSync(filePath);
		return new Response(buffer, {
			status: 200,
			headers: { 'Content-Type': 'application/wasm' },
		});
	}
	return origFetch(input, init);
};
