import { queryOptions, useQuery } from '@tanstack/react-query';
import type { QueryConfig } from '../../../lib/react-query';
import { api } from '../../../lib/api-client';
import type { FeatureFlags } from '../../../types/api';

export const getFlags = ({
  projectId,
}: Pick<UseFlagsOptions, 'projectId'>): Promise<{ data: FeatureFlags[] }> => {
  return api.get(`/projects/${projectId}/flags`);
};

export function getFlagsQueryOptions(projectId: number) {
  return queryOptions({
    queryKey: ['flags', { projectId }],
    queryFn: () => getFlags({ projectId }),
  });
}

type UseFlagsOptions = {
  projectId: number;
  queryConfig?: QueryConfig<typeof getFlagsQueryOptions>;
};

export const useFlags = ({ projectId, queryConfig }: UseFlagsOptions) => {
  return useQuery({ ...getFlagsQueryOptions(projectId), ...queryConfig });
};
