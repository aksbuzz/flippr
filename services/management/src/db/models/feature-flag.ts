export interface FeatureFlag {
  id: number;
  project_id: number;
  name: string;
  key: string;
  description: string;
  created_at: Date;
}

export interface EnvironmentFlagState {
  id: number;
  environment_id: number;
  feature_flag_id: number;
  is_enabled: boolean;
}