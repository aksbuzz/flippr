import { db } from '../src/config/database';
import { FlagVariant } from '../src/db/models/flag-variants';

export async function createTestProject() {
  const { id } = await db.one(`INSERT INTO projects (name) VALUES ($1) RETURNING id`, [
    'Test Project',
  ]);
  return id;
}

export async function createTestEnvironment(projectId: string) {
  const { id } = await db.one(
    `INSERT INTO environments (project_id, name, sdk_key) VALUES ($1, $2, $3) RETURNING id`,
    [projectId, 'test-env', 'test-sdk-key-123']
  );
  return id;
}

export async function createTestFlag(projectId: string) {
  const { id } = await db.one(
    `INSERT INTO feature_flags (project_id, name, key, description, flag_type, off_value)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [projectId, 'Test Flag', 'test_flag', 'A test flag', 'boolean', '"false"']
  );
  return id;
}

export async function createEnvironmentFlagState(
  environmentId: string,
  flagId: string,
  isEnabled = false
) {
  await db.none(
    `INSERT INTO environment_flag_states (environment_id, feature_flag_id, is_enabled)
     VALUES ($1, $2, $3)`,
    [environmentId, flagId, isEnabled]
  );
}

export async function createFlagVariant(flagId: string, key: string, value: any) {
  const result = await db.one<FlagVariant>(
    `INSERT INTO feature_flag_variants (feature_flag_id, key, value)
     VALUES ($1, $2, $3)
     RETURNING id, feature_flag_id, key, value, description, created_at`,
    [flagId, key, JSON.stringify(value)]
  );
  return result;
}

export async function deleteFlagVariants(variantIds: string[]) {
  const placeholders = variantIds.map((_, index) => `$${index + 1}`).join(', ');
  await db.none('DELETE FROM feature_flag_variants WHERE id IN (' + placeholders + ')', variantIds);
}

export async function cleanupTestData() {
  await db.none('DELETE FROM environment_flag_states');
  await db.none('DELETE FROM feature_flag_variants');
  await db.none('DELETE FROM feature_flags');
  await db.none('DELETE FROM environments');
  await db.none('DELETE FROM projects');
}
