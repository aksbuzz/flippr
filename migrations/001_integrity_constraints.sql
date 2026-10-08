-- Upgrades a database created from an older init.sql (see docs/adr/0011).
-- Idempotent: safe to run more than once. Fresh databases already get these from init.sql.
--
-- It will FAIL if the data already violates a constraint (duplicate project names, duplicate
-- environment names within a project, or a flag serving another flag's variant). Fix the data
-- first; the queries in the comments below find the offenders.
--   SELECT name, COUNT(*) FROM projects GROUP BY name HAVING COUNT(*) > 1;
--   SELECT project_id, name, COUNT(*) FROM environments GROUP BY 1, 2 HAVING COUNT(*) > 1;
--   SELECT efs.* FROM environment_flag_states efs
--     JOIN feature_flag_variants v ON v.id = efs.serving_variant_id
--    WHERE v.feature_flag_id <> efs.feature_flag_id;

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_project_name') THEN
    ALTER TABLE projects ADD CONSTRAINT unique_project_name UNIQUE (name);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_environment_name_per_project') THEN
    ALTER TABLE environments
      ADD CONSTRAINT unique_environment_name_per_project UNIQUE (project_id, name);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_environment_sdk_key') THEN
    ALTER TABLE environments ADD CONSTRAINT unique_environment_sdk_key UNIQUE (sdk_key);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'unique_variant_id_per_flag') THEN
    ALTER TABLE feature_flag_variants
      ADD CONSTRAINT unique_variant_id_per_flag UNIQUE (feature_flag_id, id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'environment_flag_states_own_variant_fk') THEN
    ALTER TABLE environment_flag_states
      ADD CONSTRAINT environment_flag_states_own_variant_fk
      FOREIGN KEY (feature_flag_id, serving_variant_id)
      REFERENCES feature_flag_variants (feature_flag_id, id);
    -- the old single-column FK is now redundant
    ALTER TABLE environment_flag_states
      DROP CONSTRAINT IF EXISTS environment_flag_states_serving_variant_id_fkey;
  END IF;
END
$$;

COMMIT;
