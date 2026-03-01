const R = 6_371_000; // Earth radius in meters

export function destinationPoint(
	origin: { lat: number; lng: number },
	bearingDeg: number,
	distanceMeters: number
): { lat: number; lng: number } {
	const δ = distanceMeters / R;
	const θ = (bearingDeg * Math.PI) / 180;
	const φ1 = (origin.lat * Math.PI) / 180;
	const λ1 = (origin.lng * Math.PI) / 180;

	const φ2 = Math.asin(
		Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
	);
	const λ2 =
		λ1 +
		Math.atan2(
			Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
			Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
		);

	return { lat: (φ2 * 180) / Math.PI, lng: (λ2 * 180) / Math.PI };
}

export function geodesicPoints(
	origin: { lat: number; lng: number },
	bearingDeg: number,
	totalDistanceMeters: number = 20_000_000,
	numPoints: number = 100
): { lat: number; lng: number }[] {
	const points: { lat: number; lng: number }[] = [];
	for (let i = 0; i <= numPoints; i++) {
		const d = (i / numPoints) * totalDistanceMeters;
		points.push(destinationPoint(origin, bearingDeg, d));
	}
	return points;
}
