import type { ChartConfig, PlanetLine } from './types';

export const DEFAULT_PLANETS: Omit<PlanetLine, 'azimuth'>[] = [
	{ id: 'sun', name: 'Sun', symbol: '☉', color: '#FF4444', lineStyle: 'solid', visible: true, category: 'personal' },
	{ id: 'moon', name: 'Moon', symbol: '☽', color: '#4444FF', lineStyle: 'solid', visible: true, category: 'personal' },
	{ id: 'mercury', name: 'Mercury', symbol: '☿', color: '#44AA44', lineStyle: 'solid', visible: true, category: 'personal' },
	{ id: 'venus', name: 'Venus', symbol: '♀', color: '#44CC44', lineStyle: 'solid', visible: true, category: 'personal' },
	{ id: 'mars', name: 'Mars', symbol: '♂', color: '#FF4444', lineStyle: 'solid', visible: true, category: 'personal' },
	{ id: 'jupiter', name: 'Jupiter', symbol: '♃', color: '#CC4444', lineStyle: 'solid', visible: true, category: 'social' },
	{ id: 'saturn', name: 'Saturn', symbol: '♄', color: '#333333', lineStyle: 'solid', visible: true, category: 'social' },
	{ id: 'uranus', name: 'Uranus', symbol: '♅', color: '#4444FF', lineStyle: 'dashed', visible: true, category: 'transpersonal' },
	{ id: 'neptune', name: 'Neptune', symbol: '♆', color: '#6644FF', lineStyle: 'dashed', visible: true, category: 'transpersonal' },
	{ id: 'pluto', name: 'Pluto', symbol: '♇', color: '#44AA44', lineStyle: 'dashed', visible: true, category: 'transpersonal' },
	{ id: 'nnode', name: 'N. Node', symbol: '☊', color: '#666666', lineStyle: 'dashed', visible: true, category: 'point' },
	{ id: 'chiron', name: 'Chiron', symbol: '⚷', color: '#666666', lineStyle: 'dashed', visible: true, category: 'point' },
	{ id: 'asc', name: 'ASC', symbol: 'ASC', color: '#888888', lineStyle: 'solid', visible: true, category: 'point' },
	{ id: 'mc', name: 'MC', symbol: 'MC', color: '#888888', lineStyle: 'solid', visible: true, category: 'point' },
];

const SAMPLE_AZIMUTHS: Record<string, number> = {
	sun: 211, moon: 195, mercury: 215, venus: 239, mars: 200,
	jupiter: 68, saturn: 301, uranus: 307, neptune: 318, pluto: 266,
	nnode: 136, chiron: 157, asc: 332, mc: 270,
};

export const SAMPLE_CHART: ChartConfig = {
	id: 'sample',
	name: 'Sample Chart (Palo Alto)',
	centerLocation: { lat: 37.4419, lng: -122.143, label: 'Palo Alto, CA' },
	createdAt: new Date().toISOString(),
	planets: DEFAULT_PLANETS.map((p) => ({
		...p,
		azimuth: SAMPLE_AZIMUTHS[p.id] ?? null,
	})),
};
