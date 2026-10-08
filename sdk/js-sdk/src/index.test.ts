import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FlipprClient } from './index';

const json = (body: unknown, status = 200) =>
  Promise.resolve(new Response(JSON.stringify(body), { status }));

describe('FlipprClient', () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterEach(() => vi.unstubAllGlobals());

  it('requires an sdk key', () => {
    expect(() => new FlipprClient({ sdkKey: '' })).toThrow();
  });

  it('calls the evaluation API path the server actually serves', async () => {
    fetchMock.mockReturnValue(json({ value: true }));
    const client = new FlipprClient({ sdkKey: 'k', baseUrl: 'http://localhost:8080/' });

    expect(await client.getVariant('new-flow', false)).toBe(true);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('http://localhost:8080/api/v1/evaluate/flags/new-flow');
    expect(init.headers.Authorization).toBe('k');
  });

  it('url-encodes the flag key', async () => {
    fetchMock.mockReturnValue(json({ value: 1 }));
    await new FlipprClient({ sdkKey: 'k' }).getVariant('a/b c', 0);
    expect(fetchMock.mock.calls[0][0]).toContain('/flags/a%2Fb%20c');
  });

  it('returns the default for null, HTTP errors and network errors', async () => {
    const client = new FlipprClient({ sdkKey: 'k' });
    fetchMock.mockReturnValueOnce(json({ value: null }));
    expect(await client.getVariant('a', 'dflt')).toBe('dflt');
    fetchMock.mockReturnValueOnce(json({}, 404));
    expect(await client.getVariant('b', 'dflt')).toBe('dflt');
    fetchMock.mockRejectedValueOnce(new Error('network down'));
    expect(await client.getVariant('c', 'dflt')).toBe('dflt');
  });

  it('caches values and does not cache defaults', async () => {
    const client = new FlipprClient({ sdkKey: 'k' });
    fetchMock.mockReturnValue(json({ value: 'x' }));
    await client.getVariant('f', 'd');
    await client.getVariant('f', 'd');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    fetchMock.mockReset();
    fetchMock.mockReturnValue(json({ value: null }));
    await client.getVariant('g', 'd');
    await client.getVariant('g', 'd');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('shares one request between concurrent callers', async () => {
    fetchMock.mockImplementation(() => json({ value: 5 }));
    const client = new FlipprClient({ sdkKey: 'k' });
    const results = await Promise.all([client.getVariant('f', 0), client.getVariant('f', 0)]);
    expect(results).toEqual([5, 5]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('gives up after the timeout and returns the default', async () => {
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_, reject) =>
          init.signal!.addEventListener('abort', () => reject(new Error('aborted')))
        )
    );
    const client = new FlipprClient({ sdkKey: 'k', timeoutMs: 20 });
    expect(await client.getVariant('slow', 'dflt')).toBe('dflt');
  });
});
