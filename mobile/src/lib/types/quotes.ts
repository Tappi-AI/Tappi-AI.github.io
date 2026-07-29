export interface Quote {
	id: number;
	text: string;
	author: string;
	role: string;
}

export interface LikedQuote {
	id: number;
	likedAt: string;
}

export interface VoiceMemo {
	quoteId: number;
	blob: Blob;
	createdAt: string;
	duration: number;
}
