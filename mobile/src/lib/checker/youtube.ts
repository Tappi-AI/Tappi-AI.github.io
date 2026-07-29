// src/lib/checker/youtube.ts

export async function checkYouTube(username: string): Promise<boolean> {
	// normalize (remove leading @ if user typed it)
	const handle = username.startsWith('@') ? username.slice(1) : username;

	const url = `https://www.youtube.com/@${handle}`;

	try {
		const res = await fetch(url, {
			method: 'HEAD',
			redirect: 'manual'
		});

		// 200 → channel exists → taken
		if (res.status === 200) return false;

		// 404 → available
		if (res.status === 404) return true;

		// Other responses → assume taken (safer)
		return false;
	} catch (err) {
		console.error('YouTube check failed:', err);
		return false;
	}
}
