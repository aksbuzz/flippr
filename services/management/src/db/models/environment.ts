export interface Environment {
  id: number;
  project_id: number;
  name: 'dev' | 'staging' | 'production' | 'test' | 'qa' | 'uat';
  sdk_key: string;
}