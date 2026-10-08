export type FlagType = 'boolean' | 'number' | 'string' | 'json';

/** Parses a JSON-encoded string; returns undefined when it is not valid JSON. */
export const tryParseJson = (value: string): { ok: true; value: unknown } | { ok: false } => {
  try {
    return { ok: true, value: JSON.parse(value) };
  } catch {
    return { ok: false };
  }
};

/** Returns an error message when `jsonValue` (a JSON-encoded string) does not fit `flagType`. */
export function checkValueMatchesType(flagType: FlagType, jsonValue: string): string | null {
  const parsed = tryParseJson(jsonValue);
  if (!parsed.ok) return 'value must be a valid JSON string';

  const v = parsed.value;
  switch (flagType) {
    case 'boolean':
      return typeof v === 'boolean' ? null : 'value must be a JSON boolean (true or false)';
    case 'number':
      return typeof v === 'number' ? null : 'value must be a JSON number';
    case 'string':
      return typeof v === 'string' ? null : 'value must be a JSON string (for example "\\"hello\\"")';
    case 'json':
      return v !== null && typeof v === 'object' ? null : 'value must be a JSON object or array';
  }
}
