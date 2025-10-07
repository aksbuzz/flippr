export interface FlagState {
  id: string;
  environment_id: string;
  feature_flag_id: string;
  serving_variant_id: string;
  is_enabled: boolean;
}
