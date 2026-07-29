import { describe, expect, it } from 'vitest';
import { energyColor, energyTextColor } from './energyColor';

describe('energyColor', () => {
	it('maps 0 to hue 0', () => {
		expect(energyColor(0)).toBe('hsl(0, 75%, 45%)');
	});

	it('maps 50 to hue 60', () => {
		expect(energyColor(50)).toBe('hsl(60, 75%, 45%)');
	});

	it('maps 100 to hue 120', () => {
		expect(energyColor(100)).toBe('hsl(120, 75%, 45%)');
	});

	it('clamps values below 0', () => {
		expect(energyColor(-20)).toBe('hsl(0, 75%, 45%)');
	});

	it('clamps values above 100', () => {
		expect(energyColor(150)).toBe('hsl(120, 75%, 45%)');
	});

	it('produces distinct hues for distinct percentages', () => {
		expect(energyColor(90)).toBe('hsl(108, 75%, 45%)');
		expect(energyColor(40)).toBe('hsl(48, 75%, 45%)');
		expect(energyColor(70)).toBe('hsl(84, 75%, 45%)');
	});
});

describe('energyTextColor', () => {
	it('returns white below 60', () => {
		expect(energyTextColor(0)).toBe('#fff');
		expect(energyTextColor(59)).toBe('#fff');
	});

	it('returns dark gray at and above 60', () => {
		expect(energyTextColor(60)).toBe('#1f2937');
		expect(energyTextColor(100)).toBe('#1f2937');
	});

	it('clamps out-of-range values', () => {
		expect(energyTextColor(-10)).toBe('#fff');
		expect(energyTextColor(200)).toBe('#1f2937');
	});
});
