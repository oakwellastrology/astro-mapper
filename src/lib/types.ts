export interface ChartConfig {
	id: string;
	name: string;
	centerLocation: {
		lat: number;
		lng: number;
		label: string;
	};
	planets: PlanetLine[];
	createdAt: string;
}

export interface SavedLocation {
	id: string;
	lat: number;
	lng: number;
	label: string;
}

export interface BirthData {
	year: number;
	month: number; // 1-12
	day: number; // 1-31
	hour: number; // 0-23
	minute: number; // 0-59
	latitude: number;
	longitude: number;
	locationLabel: string;
	timezoneOffset: number; // hours from UTC (e.g. -5 for EST)
	timezoneId: string; // IANA timezone ID, e.g. "America/New_York"
}

export interface PlanetLine {
	id: string;
	name: string;
	symbol: string;
	azimuth: number | null;
	color: string;
	lineStyle: 'solid' | 'dashed';
	visible: boolean;
	category: 'personal' | 'social' | 'transpersonal' | 'point';
}
