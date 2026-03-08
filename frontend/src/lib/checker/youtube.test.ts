import { describe, it, expect } from 'vitest';
import { checkYouTube } from './youtube';

describe('YouTube username availability', () => {
	it('posetmage -> used', async () => {
		const result = await checkYouTube('posetmage');
		expect(result).toBe(false);
	});

	it('9dasgf025i23p5ru2o3ji -> not used', async () => {
		const result = await checkYouTube('9dasgf025i23p5ru2o3ji');
		expect(result).toBe(true);
	});

	it('pikachu -> used', async () => {
		const result = await checkYouTube('pikachu');
		expect(result).toBe(false);
	});

	it('1590ashedjvfdlas -> not used', async () => {
		const result = await checkYouTube('1590ashedjvfdlas');
		expect(result).toBe(true);
	});
});
