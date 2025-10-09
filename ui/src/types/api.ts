import type { FlagType } from '.';

export type Base = { id: string };

export type FeatureFlag = Base & {
  project_id: string;
  name: string;
  key: string;
  flag_type: FlagType;
  off_value: string;
  created_at: Date;
  description?: string;
};

export type FlagVariant = Base & {
  feature_flag_id: string;
  key: string;
  value: string;
  description: string;
  created_at: Date;
};

export type FeatureFlagsResponse = FeatureFlag & {
  environments: { id: string; is_enabled: boolean }[];
};

export type FeatureFlagResponse = FeatureFlag & {
  variants: Omit<FlagVariant, 'feature_flag_id'>[];
  environments: {
    id: string,
    name: string,
    is_enabled: boolean,
    serving_variant_id: string,
    serving_variant_key: string
  }[]
}

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
  environment_id: string;
  feature_flag_id: string;
  serving_variant_id: string;
  is_enabled: boolean;
};

export type EnvironmentFlagStateResponse = Omit<EnvironmentFlagState, 'feature_flag_id'> & { flag_id: string };
