import { queryOptions, useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';
import type { QueryConfig } from '../../../lib/react-query';
import type { FeatureFlagResponse } from '../../../types/api';

export const getFlag = ({
  projectId,
  flagId,
}: Omit<UseFlagOptions, 'queryConfig'>): Promise<{ data: FeatureFlagResponse }> => {
  return api.get(`/projects/${projectId}/flags/${flagId}`);
};

export function getFlagQueryOptions(projectId: string, flagId: string) {
  return queryOptions({
    queryKey: ['flag', { projectId, flagId }],
    queryFn: () => getFlag({ projectId, flagId }),
  });
}

type UseFlagOptions = {
  projectId: string;
  flagId: string;
  queryConfig?: QueryConfig<typeof getFlagQueryOptions>;
};

export const useFlag = ({ projectId, flagId, queryConfig }: UseFlagOptions) => {
  return useQuery({ ...getFlagQueryOptions(projectId, flagId), ...queryConfig });
};
