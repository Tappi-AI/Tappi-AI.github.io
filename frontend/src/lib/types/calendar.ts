export interface TimeBlock {
	id: string;
	hour: number;
	task: string;
	energy: number; // 0-5
	emoji: string | null;
}

export interface CalendarDay {
	date: string; // YYYY-MM-DD
	blocks: TimeBlock[];
}

export const EMOJIS = ['😊', '😤', '😴', '🔥', '😰'] as const;

export const ENERGY_LABELS: Record<number, string> = {
	0: 'None',
	1: 'Very Low',
	2: 'Low',
	3: 'Medium',
	4: 'High',
	5: 'Max'
};

export const START_HOUR = 6;
export const END_HOUR = 22;
