CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE flag_type AS ENUM ('boolean', 'number', 'string', 'json');

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS environments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL, -- dev, staging, production
  sdk_key VARCHAR(255) NOT NULL, -- secret sdk key for this environment
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL, -- human readable name
  key VARCHAR(255) NOT NULL, -- feature flag name
  description VARCHAR(255) NOT NULL,
  flag_type flag_type NOT NULL DEFAULT 'boolean',
  off_value JSONB NOT NULL DEFAULT 'false'::jsonb, -- Value to use when flag is off
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
  CONSTRAINT unique_flag_key_per_project UNIQUE (project_id, key)
);

CREATE TABLE IF NOT EXISTS feature_flag_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  feature_flag_id UUID NOT NULL,
  key VARCHAR(255) NOT NULL, -- Name of the variant
  value JSONB NOT NULL, -- e.g. 'true', '"yellow"', '100', '{"size": 12}'
  description VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (feature_flag_id) REFERENCES feature_flags (id) ON DELETE CASCADE,
  CONSTRAINT unique_variant_key_per_flag UNIQUE (feature_flag_id, key)
);

CREATE TABLE IF NOT EXISTS environment_flag_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  environment_id UUID NOT NULL,
  feature_flag_id UUID NOT NULL,
  serving_variant_id UUID, -- which variant to serve
  is_enabled BOOLEAN NOT NULL,
  
  FOREIGN KEY (environment_id) REFERENCES environments (id) ON DELETE CASCADE,
  FOREIGN KEY (feature_flag_id) REFERENCES feature_flags (id) ON DELETE CASCADE,
  FOREIGN KEY (serving_variant_id) REFERENCES feature_flag_variants (id),
  CONSTRAINT unique_environment_flag UNIQUE (environment_id, feature_flag_id)
);

CREATE INDEX IF NOT EXISTS environment_flag_states_feature_flag_id_idx ON environment_flag_states (feature_flag_id);

-- CREATE TABLE IF NOT EXISTS audit_log (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   environment_id UUID NOT NULL,
--   feature_flag_id UUID NOT NULL,
--   old_state BOOLEAN NOT NULL,
--   new_state BOOLEAN NOT NULL,
--   -- user_id UUID NOT NULL,
--   timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
-- );
