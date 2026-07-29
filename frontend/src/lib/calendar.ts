const MS_PER_DAY = 24 * 60 * 60 * 1000;

export function monthMatrix(year: number, month: number): Date[][] {
	const firstOfMonth = new Date(year, month, 1);
	const lastOfMonth = new Date(year, month + 1, 0);

	const start = new Date(firstOfMonth);
	start.setDate(start.getDate() - start.getDay());

	const end = new Date(lastOfMonth);
	end.setDate(end.getDate() + (6 - end.getDay()));

	const totalDays = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY) + 1;

	const weeks: Date[][] = [];
	for (let i = 0; i < totalDays; i += 7) {
		const week: Date[] = [];
		for (let j = 0; j < 7; j++) {
			const day = new Date(start);
			day.setDate(day.getDate() + i + j);
			week.push(day);
		}
		weeks.push(week);
	}

	return weeks;
}

export function dayKey(d: Date): string {
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function isSameMonth(d: Date, year: number, month: number): boolean {
	return d.getFullYear() === year && d.getMonth() === month;
}
