export type Base = { id: string };

export type FeatureFlag = Base & {
  project_id: string;
  name: string;
  key: string;
  description: string;
  created_at: Date;
};

export type FeatureFlags = FeatureFlag & {
  environments:
    {
      id: string;
      name: string;
      is_enabled: boolean;
    }[];
};

export type Project = Base & {
  name: string;
  created_at: Date;
};

export type Environment = Base & {
  project_id: string;
  name: string;
  sdk_key: string;
};

export type EnvironmentFlagState = Base & {
  project_id: string;
  environment_id: string;
  sdk_key: string;
  key: string;
  is_enabled: boolean;
};
