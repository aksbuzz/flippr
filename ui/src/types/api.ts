export type FeatureFlag = {
  id: number;
  project_id: number;
  name: string;
  key: string;
  description: string;
  created_at: Date;
};

export type FeatureFlags = FeatureFlag & {
  environments: {
    id: number;
    name: string;
    is_enabled: boolean;
  }[];
};
