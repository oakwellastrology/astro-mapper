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
