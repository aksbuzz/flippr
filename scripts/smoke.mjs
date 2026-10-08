// End-to-end smoke test for a running Compose stack (docker compose up --build).
// Management -> PostgreSQL -> Redis -> Evaluation -> SDK, plus the UI's /api proxy.
//
//   ADMIN_API_TOKEN=... node scripts/smoke.mjs
//
// Needs Node 18+ and a built SDK (cd sdk/js-sdk && npm ci && npm run build).
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const MGMT = process.env.MANAGEMENT_URL ?? 'http://127.0.0.1:4000/api/v1';
const UI = process.env.UI_URL ?? 'http://127.0.0.1';
const EVAL = process.env.EVALUATION_URL ?? 'http://127.0.0.1:8080';
const TOKEN = process.env.ADMIN_API_TOKEN;
if (!TOKEN) throw new Error('Set ADMIN_API_TOKEN to the token the stack was started with');

const { FlipprClient } = createRequire(import.meta.url)('../sdk/js-sdk/dist/index.js');

const auth = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const call = async (method, path, body, base = MGMT, headers = auth) => {
  const res = await fetch(`${base}${path}`, { method, headers, body: body && JSON.stringify(body) });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, body: json };
};
const ok = async (method, path, body, expected = 200) => {
  const r = await call(method, path, body);
  assert.equal(r.status, expected, `${method} ${path} -> ${r.status} ${JSON.stringify(r.body)}`);
  return r.body.data;
};
const step = name => console.log(`- ${name}`);

async function waitFor(url, label) {
  for (let i = 0; i < 60; i++) {
    try {
      if ((await fetch(url)).ok) return;
    } catch {}
    await new Promise(r => setTimeout(r, 1000));
  }
  throw new Error(`${label} did not become healthy: ${url}`);
}

await waitFor(`${MGMT}/health`, 'management');
await waitFor(`${EVAL}/api/v1/health`, 'evaluation');

step('management API requires the admin token');
assert.equal((await call('GET', '/projects', undefined, MGMT, {})).status, 401);

step('UI nginx proxies /api to the management API');
const viaUi = await call('GET', '/api/v1/projects', undefined, UI);
assert.equal(viaUi.status, 200, `UI proxy returned ${viaUi.status}`);

step('create project, environment, flag');
const stamp = Date.now();
const project = await ok('POST', '/projects', { name: `smoke-${stamp}` }, 201);
const env = await ok('POST', `/projects/${project.id}/environments`, { name: 'prod' }, 201);
const flag = await ok(
  'POST',
  `/projects/${project.id}/flags`,
  { name: 'Checkout', key: 'checkout-button', flag_type: 'string', off_value: '"Buy Now"' },
  201
);

const sdk = () => new FlipprClient({ sdkKey: env.sdk_key, baseUrl: EVAL, cacheTTLSeconds: 0 });

step('a new flag evaluates to its off_value through the SDK (not null)');
assert.equal(await sdk().getVariant('checkout-button', 'DEFAULT'), 'Buy Now');

step('toggle on with a variant, SDK sees the variant');
const variant = await ok('POST', `/flags/${flag.id}/variants`, { key: 'v2', value: '"Proceed"' }, 201);
await ok('PATCH', `/flags/${flag.id}/environments/${env.id}`, {
  is_enabled: true,
  serving_variant_id: variant.id,
});
assert.equal(await sdk().getVariant('checkout-button', 'DEFAULT'), 'Proceed');

step('toggle off, SDK sees off_value again');
await ok('PATCH', `/flags/${flag.id}/environments/${env.id}`, { is_enabled: false });
assert.equal(await sdk().getVariant('checkout-button', 'DEFAULT'), 'Buy Now');

step('unknown flag and wrong SDK key fall back to the default');
assert.equal(await sdk().getVariant('does-not-exist', 'DEFAULT'), 'DEFAULT');
assert.equal(
  await new FlipprClient({ sdkKey: 'wrong', baseUrl: EVAL }).getVariant('checkout-button', 'DEFAULT'),
  'DEFAULT'
);

console.log('\nSmoke test passed');
