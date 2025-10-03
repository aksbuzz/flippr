import { queryOptions, useQuery } from '@tanstack/react-query';
import type { QueryConfig } from '../../../lib/react-query';
import { api } from '../../../lib/api-client';
import type { Environment } from '../../../types/api';

export const getEnvironments = ({
  projectId,
}: {
  projectId: number;
}): Promise<{ data: Environment[] }> => {
  return api.get(`/projects/${projectId}/environments`);
};

export function getEnvironmentsQueryOptions(projectId: number) {
  return queryOptions({
    queryKey: ['environments', { projectId }],
    queryFn: () => getEnvironments({ projectId }),
  });
}

type UseEnvironment = {
  projectId: number;
  queryConfig?: QueryConfig<typeof getEnvironmentsQueryOptions>;
};

export const useEnvironments = ({ projectId, queryConfig }: UseEnvironment) => {
  return useQuery({ ...getEnvironmentsQueryOptions(projectId), ...queryConfig });
};
