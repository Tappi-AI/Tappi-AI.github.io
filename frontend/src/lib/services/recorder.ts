export type RecordingState = 'idle' | 'recording' | 'stopped';

export interface RecordingResult {
	blob: Blob;
	duration: number;
	url: string;
}

let mediaRecorder: MediaRecorder | null = null;
let chunks: Blob[] = [];
let startTime = 0;

export async function startRecording(): Promise<void> {
	const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
	mediaRecorder = new MediaRecorder(stream);
	chunks = [];
	startTime = Date.now();

	mediaRecorder.ondataavailable = (e) => {
		if (e.data.size > 0) chunks.push(e.data);
	};

	mediaRecorder.start();
}

export function stopRecording(): Promise<RecordingResult> {
	return new Promise((resolve, reject) => {
		if (!mediaRecorder) {
			reject(new Error('No recording in progress'));
			return;
		}

		mediaRecorder.onstop = () => {
			const duration = Math.round((Date.now() - startTime) / 1000);
			const blob = new Blob(chunks, { type: 'audio/webm' });
			const url = URL.createObjectURL(blob);

			// Stop all tracks to release microphone
			mediaRecorder?.stream.getTracks().forEach((t) => t.stop());
			mediaRecorder = null;
			chunks = [];

			resolve({ blob, duration, url });
		};

		mediaRecorder.stop();
	});
}

export function isRecordingSupported(): boolean {
	return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
}

const MEMOS_KEY = 'inspire_voice_memos';

interface StoredMemo {
	quoteId: number;
	createdAt: string;
	duration: number;
	url: string;
}

export function saveMemoReference(quoteId: number, duration: number, url: string): void {
	try {
		const stored = localStorage.getItem(MEMOS_KEY);
		const memos: StoredMemo[] = stored ? JSON.parse(stored) : [];
		memos.push({ quoteId, createdAt: new Date().toISOString(), duration, url });
		localStorage.setItem(MEMOS_KEY, JSON.stringify(memos));
	} catch {
		// Storage full or unavailable
	}
}
