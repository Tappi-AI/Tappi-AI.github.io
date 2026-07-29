import { type TimeBlock, type CalendarDay, START_HOUR, END_HOUR } from '$lib/types/calendar';

export function createTimeBlock(hour: number, dateStr: string): TimeBlock {
	return {
		id: `${dateStr}-${hour}`,
		hour,
		task: '',
		energy: 0,
		emoji: null
	};
}

export function createDay(date: Date): CalendarDay {
	const dateStr = formatDate(date);
	const blocks: TimeBlock[] = [];
	for (let h = START_HOUR; h <= END_HOUR; h++) {
		blocks.push(createTimeBlock(h, dateStr));
	}
	return { date: dateStr, blocks };
}

export function formatDate(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

export function formatHour(hour: number): string {
	const suffix = hour >= 12 ? 'PM' : 'AM';
	const h = hour % 12 || 12;
	return `${h}:00 ${suffix}`;
}

export function addDays(date: Date, days: number): Date {
	const result = new Date(date);
	result.setDate(result.getDate() + days);
	return result;
}

export function getWeekDates(baseDate: Date): Date[] {
	const day = baseDate.getDay();
	const monday = addDays(baseDate, -((day + 6) % 7));
	return Array.from({ length: 7 }, (_, i) => addDays(monday, i));
}

export function getDayLabel(date: Date): string {
	return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

const STORAGE_KEY = 'calendar-data';

export function saveCalendarData(days: Record<string, CalendarDay>): void {
	try {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(days));
	} catch {
		// storage full or unavailable
	}
}

export function loadCalendarData(): Record<string, CalendarDay> {
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (raw) return JSON.parse(raw);
	} catch {
		// corrupted data
	}
	return {};
}

export function energyColor(level: number): string {
	const colors: Record<number, string> = {
		0: 'bg-gray-700',
		1: 'bg-red-900',
		2: 'bg-orange-800',
		3: 'bg-yellow-700',
		4: 'bg-green-700',
		5: 'bg-emerald-500'
	};
	return colors[level] ?? 'bg-gray-700';
}
