import type { Quote, LikedQuote } from '$lib/types/quotes';
import { quotes } from '$lib/data/quotes';

const LIKED_KEY = 'inspire_liked_quotes';
const LAST_INDEX_KEY = 'inspire_last_index';

export function getRandomQuote(excludeId?: number): Quote {
	const pool = excludeId ? quotes.filter((q) => q.id !== excludeId) : quotes;
	const idx = Math.floor(Math.random() * pool.length);
	return pool[idx];
}

export function getLikedIds(): Set<number> {
	try {
		const stored = localStorage.getItem(LIKED_KEY);
		if (!stored) return new Set();
		const liked: LikedQuote[] = JSON.parse(stored);
		return new Set(liked.map((l) => l.id));
	} catch {
		return new Set();
	}
}

export function toggleLike(quoteId: number): boolean {
	const liked = getLikedList();
	const exists = liked.findIndex((l) => l.id === quoteId);

	if (exists >= 0) {
		liked.splice(exists, 1);
		localStorage.setItem(LIKED_KEY, JSON.stringify(liked));
		return false;
	}

	liked.push({ id: quoteId, likedAt: new Date().toISOString() });
	localStorage.setItem(LIKED_KEY, JSON.stringify(liked));
	return true;
}

function getLikedList(): LikedQuote[] {
	try {
		const stored = localStorage.getItem(LIKED_KEY);
		return stored ? JSON.parse(stored) : [];
	} catch {
		return [];
	}
}

const gradients = [
	'from-violet-900 via-purple-800 to-indigo-900',
	'from-slate-900 via-emerald-900 to-teal-900',
	'from-rose-900 via-pink-800 to-fuchsia-900',
	'from-sky-900 via-cyan-800 to-blue-900',
	'from-amber-900 via-orange-900 to-yellow-900',
	'from-indigo-900 via-blue-800 to-violet-900',
	'from-teal-900 via-green-800 to-emerald-900',
	'from-fuchsia-900 via-purple-900 to-pink-900',
];

export function getGradient(index: number): string {
	return gradients[index % gradients.length];
}

export function getInitials(name: string): string {
	return name
		.split(' ')
		.map((w) => w[0])
		.join('')
		.toUpperCase()
		.slice(0, 2);
}
