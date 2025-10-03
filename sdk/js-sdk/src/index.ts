export interface FlipprClientOptions {
  sdkKey: string;
  baseUrl?: string;
  cacheTTLSeconds?: number;
}

interface CacheEntry {
  value: boolean;
  expiration: number;
}

export class FlipprClient<TFlagKeys extends string = string> {
  private readonly sdkKey: string;
  private readonly baseUrl: string;
  private readonly cacheTTLSeconds: number;

  private readonly cache: Map<string, CacheEntry> = new Map();

  constructor(options: FlipprClientOptions) {
    if (!options.sdkKey) {
      throw new Error('Flippr SDK key is required');
    }

    this.sdkKey = options.sdkKey;
    this.baseUrl = options.baseUrl || 'https://api.flippr.io/';

    this.cacheTTLSeconds = (options.cacheTTLSeconds ?? 300) * 1000;
  }

  /**
   * Checks if a flag is enabled.
   * @param {string} flagKey - The key of the flag to check.
   * @returns Whether the flag is enabled.
   */
  public async isEnabled(flagKey: TFlagKeys, defaultValue: boolean = false): Promise<boolean> {
    const cachedItem = this.cache.get(flagKey);
    if (cachedItem && cachedItem.expiration > Date.now()) {
      console.log(`Using cached value for ${flagKey}`);
      return cachedItem.value;
    }

    try {
      const response = await fetch(`${this.baseUrl}/evaluate/flags/${flagKey}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.sdkKey}`,
        },
      });

      if (!response.ok) {
        console.error(`Flippr API Error: ${response.status} ${response.statusText}`);
        return false;
      }

      const data = await response.json();

      this.cache.set(flagKey, {
        value: data.enabled,
        expiration: Date.now() + this.cacheTTLSeconds,
      });

      return data.enabled;
    } catch (error) {
      console.error('Flippr SDK Error: Failed to fetch evaluation.', error);
      return defaultValue;
    }
  }
}
