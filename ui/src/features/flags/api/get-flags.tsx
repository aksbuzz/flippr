import { queryOptions, useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';
import type { QueryConfig } from '../../../lib/react-query';
import type { FeatureFlagsResponse } from '../../../types/api';

export const getFlags = ({
  projectId,
}: Pick<UseFlagsOptions, 'projectId'>): Promise<{ data: FeatureFlagsResponse[] }> => {
  return api.get(`/projects/${projectId}/flags`);
};

export function getFlagsQueryOptions(projectId: string) {
  return queryOptions({
    queryKey: ['flags', { projectId }],
    queryFn: () => getFlags({ projectId }),
  });
}

type UseFlagsOptions = {
  projectId: string;
  queryConfig?: QueryConfig<typeof getFlagsQueryOptions>;
};

export const useFlags = ({ projectId, queryConfig }: UseFlagsOptions) => {
  return useQuery({ ...getFlagsQueryOptions(projectId), ...queryConfig });
};
