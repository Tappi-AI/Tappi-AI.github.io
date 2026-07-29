export function energyColor(pct: number): string {
	const clamped = Math.min(100, Math.max(0, pct));
	return `hsl(${clamped * 1.2}, 75%, 45%)`;
}

export function energyTextColor(pct: number): string {
	const clamped = Math.min(100, Math.max(0, pct));
	return clamped < 60 ? '#fff' : '#1f2937';
}
