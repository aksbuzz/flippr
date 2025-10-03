import { queryOptions, useQuery } from '@tanstack/react-query';
import type { QueryConfig } from '../../../lib/react-query';
import { api } from '../../../lib/api-client';
import type { Project } from '../../../types/api';

export const getProjects = (): Promise<{ data: Project[] }> => {
  return api.get(`/projects`);
};

export function getProjectsQueryOptions() {
  return queryOptions({
    queryKey: ['projects'],
    queryFn: () => getProjects(),
  });
}

type UseProjectsOptions = {
  queryConfig?: QueryConfig<typeof getProjectsQueryOptions>;
};

export const useProjects = ({ queryConfig }: UseProjectsOptions = {}) => {
  return useQuery({ ...getProjectsQueryOptions(), ...queryConfig });
};
