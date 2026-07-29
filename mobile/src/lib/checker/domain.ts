// lib/checker/domain.ts

export interface DomainCheckResult {
	domain: string;
	available: boolean;
	error?: string;
}

/**
 * Check domain availability using public RDAP API
 * This works client-side without needing a server
 */
export async function checkDomain(username: string): Promise<boolean> {
	const domain = `${username}.com`;

	try {
		// Use Verisign's RDAP API - free and no API key needed
		const response = await fetch(`https://rdap.verisign.com/com/v1/domain/${domain}`, {
			method: 'GET',
			headers: {
				Accept: 'application/json'
			}
		});

		// 200 = domain is registered (taken)
		if (response.ok) {
			return false; // Not available
		}

		// 404 = domain is not registered (available)
		if (response.status === 404) {
			return true; // Available
		}

		// Other status codes - assume taken to be safe
		return false;
	} catch (error) {
		console.error('RDAP check failed:', error);

		// Fallback: Try alternative free API
		try {
			const fallbackResponse = await fetch(
				`https://api.domainsdb.info/v1/domains/search?domain=${domain}`,
				{
					method: 'GET'
				}
			);

			if (fallbackResponse.ok) {
				const data = await fallbackResponse.json();
				// If domains array is empty or not found, it's available
				return !data.domains || data.domains.length === 0;
			}
		} catch {
			// If all checks fail, assume taken (conservative approach)
			console.error('All domain checks failed');
		}

		return false; // Assume taken if we can't verify
	}
}

/**
 * Batch check multiple domains
 */
export async function checkDomains(usernames: string[]): Promise<Map<string, boolean>> {
	const results = new Map<string, boolean>();

	// Check domains with a small delay to avoid rate limiting
	for (const username of usernames) {
		const available = await checkDomain(username);
		results.set(`${username}.com`, available);

		// Small delay between requests
		await new Promise((resolve) => setTimeout(resolve, 100));
	}

	return results;
}
