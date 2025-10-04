export interface FeatureFlag {
  id: string;
  project_id: string;
  name: string;
  key: string;
  description: string;
  created_at: Date;
}

export interface EnvironmentFlagState {
  id: string;
  environment_id: string;
  feature_flag_id: string;
  is_enabled: boolean;
}