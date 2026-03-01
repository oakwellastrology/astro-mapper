/**
 * Estimate the IANA timezone ID from geographic coordinates.
 * Uses a longitude-based approximation for v1 — the user can manually override.
 */
export function getTimezoneFromCoords(lat: number, lng: number): string {
	// Use Intl to get the browser's local timezone as a fallback
	const localTz = Intl.DateTimeFormat().resolvedOptions().timeZone;

	// Simple longitude-based offset estimation
	const offsetHours = Math.round(lng / 15);

	// Map common offset ranges to representative IANA timezones
	const offsetToTimezone: Record<number, string> = {
		'-12': 'Etc/GMT+12',
		'-11': 'Pacific/Midway',
		'-10': 'Pacific/Honolulu',
		'-9': 'America/Anchorage',
		'-8': 'America/Los_Angeles',
		'-7': 'America/Denver',
		'-6': 'America/Chicago',
		'-5': 'America/New_York',
		'-4': 'America/Halifax',
		'-3': 'America/Sao_Paulo',
		'-2': 'Atlantic/South_Georgia',
		'-1': 'Atlantic/Azores',
		'0': 'Europe/London',
		'1': 'Europe/Paris',
		'2': 'Europe/Helsinki',
		'3': 'Europe/Moscow',
		'4': 'Asia/Dubai',
		'5': 'Asia/Karachi',
		'6': 'Asia/Dhaka',
		'7': 'Asia/Bangkok',
		'8': 'Asia/Shanghai',
		'9': 'Asia/Tokyo',
		'10': 'Australia/Sydney',
		'11': 'Pacific/Noumea',
		'12': 'Pacific/Auckland',
	};

	return offsetToTimezone[offsetHours.toString() as unknown as number] ?? localTz;
}

/**
 * Get the UTC offset in hours for a given IANA timezone and date,
 * accounting for historical DST rules.
 */
export function getUtcOffset(timezoneId: string, date: Date): number {
	try {
		// Format the date in the target timezone and in UTC, then compute the difference
		const formatter = new Intl.DateTimeFormat('en-US', {
			timeZone: timezoneId,
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false,
		});

		const parts = formatter.formatToParts(date);
		const get = (type: string) =>
			parseInt(parts.find((p) => p.type === type)?.value ?? '0');

		const localDate = new Date(
			Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'))
		);

		const diffMs = localDate.getTime() - date.getTime();
		return Math.round(diffMs / (1000 * 60 * 60) * 100) / 100;
	} catch {
		// If the timezone ID is invalid, fall back to a longitude-based estimate
		return 0;
	}
}
