interface APIResponse<T> {
  value: T | null;
}

export interface FlipprClientOptions {
  sdkKey: string;
  baseUrl?: string;
  cacheTTLSeconds?: number;
  cacheMaxSize?: number;
}

interface CacheEntry {
  value: unknown;
  expiration: number;
}

export class FlipprClient<TFlagKeys extends string = string> {
  private readonly sdkKey: string;
  private readonly baseUrl: string;
  private readonly cacheTTLMs: number;
  private readonly cacheMaxSize: number;

  private readonly cache: Map<string, CacheEntry> = new Map();

  constructor(options: FlipprClientOptions) {
    if (!options.sdkKey) {
      throw new Error('Flippr SDK key is required');
    }

    this.sdkKey = options.sdkKey;
    this.baseUrl = (options.baseUrl || 'http://localhost:8080/').replace(/\/$/, '') + '/';

    this.cacheTTLMs = (options.cacheTTLSeconds ?? 300) * 1000;
    this.cacheMaxSize = options.cacheMaxSize ?? 1000;
  }

  private evictExpiredEntries(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache) {
      if (entry.expiration <= now) this.cache.delete(key);
    }
  }

  /**
   * Returns the value of the specified flag key from the Flippr API.
   *
   * @template T
   * @param {TFlagKeys} flagKey - The key of the flag to retrieve.
   * @param {T} defaultValue - The default value to return if the flag key is not found or if the API request fails.
   * @returns {Promise<T>} - A promise that resolves to the value of the specified flag key.
   */
  public async getVariant<T>(flagKey: TFlagKeys, defaultValue: T): Promise<T> {
    const cachedItem = this.cache.get(flagKey);
    if (cachedItem && cachedItem.expiration > Date.now()) {
      return cachedItem.value as T;
    }

    try {
      const response = await fetch(`${this.baseUrl}evaluate/${flagKey}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json', Authorization: this.sdkKey },
      });

      if (!response.ok) {
        console.error(
          `[Flippr] API Error for '${flagKey}': ${response.status} ${response.statusText}`
        );
        return defaultValue;
      }

      const data: APIResponse<T> = await response.json();

      if (data.value === null) return defaultValue;

      if (this.cache.size >= this.cacheMaxSize) {
        this.evictExpiredEntries();
      }
      if (this.cache.size >= this.cacheMaxSize) {
        const oldestKey = this.cache.keys().next().value;
        if (oldestKey !== undefined) this.cache.delete(oldestKey);
      }

      this.cache.set(flagKey, {
        value: data.value,
        expiration: Date.now() + this.cacheTTLMs,
      });

      return data.value;
    } catch (error) {
      console.error(`[Flippr] SDK Error: Failed to fetch evaluation for '${flagKey}'.`, error);
      return defaultValue;
    }
  }
}
