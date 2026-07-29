// lib/checker/domain.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkDomain, checkDomains } from './domain';

describe('checkDomain', () => {
	beforeEach(() => {
		// Clear any mocks before each test
		vi.clearAllMocks();
	});

	afterEach(() => {
		// Restore all mocks after each test
		vi.restoreAllMocks();
	});

	describe('real API tests (integration)', () => {
		it('should return false for taken domains like postmage', async () => {
			const result = await checkDomain('postmage');
			expect(result).toBe(false);
		}, 10000); // 10s timeout for API calls

		it('should return false for taken domains like facebook', async () => {
			const result = await checkDomain('facebook');
			expect(result).toBe(false);
		}, 10000);

		it('should return false for taken domains like youtube', async () => {
			const result = await checkDomain('youtube');
			expect(result).toBe(false);
		}, 10000);

		it('should return true for available domains like iovpuxzigtiojtorew', async () => {
			const result = await checkDomain('iovpuxzigtiojtorew');
			expect(result).toBe(true);
		}, 10000);
	});

	describe('mocked API tests (unit)', () => {
		it('should return false when API returns 200 (domain taken)', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: true,
				status: 200
			});

			const result = await checkDomain('example');
			expect(result).toBe(false);
			expect(fetch).toHaveBeenCalledWith(
				'https://rdap.verisign.com/com/v1/domain/example.com',
				expect.objectContaining({
					method: 'GET',
					headers: { Accept: 'application/json' }
				})
			);
		});

		it('should return true when API returns 404 (domain available)', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 404
			});

			const result = await checkDomain('available-domain');
			expect(result).toBe(true);
		});

		it('should return false for other status codes', async () => {
			global.fetch = vi.fn().mockResolvedValue({
				ok: false,
				status: 500
			});

			const result = await checkDomain('example');
			expect(result).toBe(false);
		});

		it('should use fallback API when primary fails', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			global.fetch = vi
				.fn()
				// First call fails (primary API)
				.mockRejectedValueOnce(new Error('Network error'))
				// Second call succeeds (fallback API)
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({ domains: [] })
				});

			const result = await checkDomain('example');
			expect(result).toBe(true); // Empty domains array = available
			expect(fetch).toHaveBeenCalledTimes(2);
			expect(fetch).toHaveBeenNthCalledWith(
				2,
				'https://api.domainsdb.info/v1/domains/search?domain=example.com',
				expect.objectContaining({ method: 'GET' })
			);

			consoleSpy.mockRestore();
		});

		it('should return false when fallback API returns domains', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			global.fetch = vi
				.fn()
				.mockRejectedValueOnce(new Error('Network error'))
				.mockResolvedValueOnce({
					ok: true,
					json: async () => ({
						domains: [{ domain: 'example.com' }]
					})
				});

			const result = await checkDomain('example');
			expect(result).toBe(false); // Has domains = taken

			consoleSpy.mockRestore();
		});

		it('should return false when all APIs fail', async () => {
			const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

			global.fetch = vi
				.fn()
				.mockRejectedValueOnce(new Error('Primary API error'))
				.mockRejectedValueOnce(new Error('Fallback API error'));

			const result = await checkDomain('example');
			expect(result).toBe(false); // Conservative approach
			expect(consoleSpy).toHaveBeenCalledWith('RDAP check failed:', expect.any(Error));
			expect(consoleSpy).toHaveBeenCalledWith('All domain checks failed');

			consoleSpy.mockRestore();
		});
	});
});

describe('checkDomains', () => {
	beforeEach(() => {
		vi.clearAllMocks();
		vi.useFakeTimers();
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.useRealTimers();
	});

	it('should check multiple domains and return a map', async () => {
		global.fetch = vi
			.fn()
			.mockResolvedValueOnce({ ok: true, status: 200 }) // facebook taken
			.mockResolvedValueOnce({ ok: false, status: 404 }) // test123 available
			.mockResolvedValueOnce({ ok: true, status: 200 }); // google taken

		const promise = checkDomains(['facebook', 'test123', 'google']);

		// Fast-forward through the delays
		await vi.runAllTimersAsync();

		const results = await promise;

		expect(results.size).toBe(3);
		expect(results.get('facebook.com')).toBe(false);
		expect(results.get('test123.com')).toBe(true);
		expect(results.get('google.com')).toBe(false);
	});

	it('should handle empty array', async () => {
		const results = await checkDomains([]);
		expect(results.size).toBe(0);
	});

	it('should continue checking even if one domain fails', async () => {
		const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		global.fetch = vi
			.fn()
			.mockRejectedValueOnce(new Error('Network error'))
			.mockRejectedValueOnce(new Error('Network error'))
			.mockResolvedValueOnce({ ok: false, status: 404 });

		const promise = checkDomains(['failing', 'available']);
		await vi.runAllTimersAsync();
		const results = await promise;

		expect(results.size).toBe(2);
		expect(results.get('failing.com')).toBe(false); // Failed = taken (conservative)
		expect(results.get('available.com')).toBe(true);

		consoleSpy.mockRestore();
	});
});
