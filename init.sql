CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS environment_flag_states (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  environment_id UUID NOT NULL,
  feature_flag_id UUID NOT NULL,
  is_enabled BOOLEAN NOT NULL,
  FOREIGN KEY (environment_id) REFERENCES environments (id) ON DELETE CASCADE,
  FOREIGN KEY (feature_flag_id) REFERENCES feature_flags (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS environment_flag_states_feature_flag_id_idx ON environment_flag_states (feature_flag_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  environment_id UUID NOT NULL,
  feature_flag_id UUID NOT NULL,
  old_state BOOLEAN NOT NULL,
  new_state BOOLEAN NOT NULL,
  -- user_id UUID NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE feature_flags ADD CONSTRAINT unique_flag_key_per_project UNIQUE (project_id, key);
ALTER TABLE environment_flag_states ADD CONSTRAINT unique_env_flag UNIQUE (environment_id, feature_flag_id);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE audit_log ADD COLUMN user_id UUID REFERENCES users (id);