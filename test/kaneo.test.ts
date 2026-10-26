import { describe, expect, test } from 'bun:test';
import { Kaneo } from '../src/kaneo.ts';

/** A fake Kaneo that answers with the given rate-limit headers and records call times. */
function fake(headers: (n: number) => Record<string, string>, status: (n: number) => number = () => 200) {
	const at: number[] = [];
	const fetchFn = (async () => {
		at.push(Date.now());
		const n = at.length;
		return new Response('[]', { status: status(n), headers: headers(n) });
	}) as unknown as typeof fetch;
	return { at, kaneo: new Kaneo('https://kaneo.test', 'key', fetchFn) };
}

describe('rate limit', () => {
	test('a call waits for the window reset when Kaneo reports one request left', async () => {
		const reset = Math.ceil((Date.now() + 1000) / 1000);
		const { at, kaneo } = fake(() => ({ 'x-ratelimit-remaining': '1', 'x-ratelimit-reset': String(reset) }));
		await kaneo.workspaces();
		await kaneo.workspaces();
		expect(at[1]! - at[0]!).toBeGreaterThanOrEqual(reset * 1000 - at[0]! - 50);
	});

	test('a 429 waits for the reset, then the call succeeds', async () => {
		const reset = Math.ceil((Date.now() + 1000) / 1000);
		const { at, kaneo } = fake(
			() => ({ 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': String(reset) }),
			(n) => (n === 1 ? 429 : 200)
		);
		expect(await kaneo.workspaces()).toEqual([]);
		expect(at).toHaveLength(2);
		expect(at[1]!).toBeGreaterThanOrEqual(reset * 1000);
	});

	test('calls run one at a time, in order', async () => {
		const { at, kaneo } = fake(() => ({ 'x-ratelimit-remaining': '50' }));
		await Promise.all([kaneo.workspaces(), kaneo.workspaces(), kaneo.workspaces()]);
		expect(at).toHaveLength(3);
		expect([...at].sort((a, b) => a - b)).toEqual(at);
	});

	test('a project is read from Kaneo once', async () => {
		const { at, kaneo } = fake(() => ({}));
		await Promise.all([kaneo.project('p1'), kaneo.project('p1')]);
		await kaneo.project('p1');
		expect(at).toHaveLength(1);
	});
});
