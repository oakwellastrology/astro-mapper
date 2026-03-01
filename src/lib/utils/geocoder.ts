export interface GeocoderResult {
	lat: number;
	lng: number;
	label: string;
}

export async function searchLocation(query: string): Promise<GeocoderResult[]> {
	const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`;

	const res = await fetch(url, {
		headers: {
			'User-Agent': 'LocalSpaceMap/1.0',
			'Accept-Language': navigator.language || 'en',
		},
	});

	if (!res.ok) return [];

	const data: { lat: string; lon: string; display_name: string }[] = await res.json();

	return data.map((item) => ({
		lat: parseFloat(item.lat),
		lng: parseFloat(item.lon),
		label: item.display_name,
	}));
}
