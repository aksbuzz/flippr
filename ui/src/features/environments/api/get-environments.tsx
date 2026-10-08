import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { PAGE_SIZE, type PageParams, type Paginated } from '../../../lib/pagination';
import type { QueryConfig } from '../../../lib/react-query';
import { api } from '../../../lib/api-client';
import type { Environment } from '../../../types/api';

export const getEnvironments = ({
  projectId,
  limit = PAGE_SIZE,
  offset = 0,
}: {
  projectId: string;
} & PageParams): Promise<Paginated<Environment>> => {
  return api.get(`/projects/${projectId}/environments`, { params: { limit, offset } });
};

export function getEnvironmentsQueryOptions(
  projectId: string,
  { limit = PAGE_SIZE, offset = 0 }: PageParams = {}
) {
  return queryOptions({
    queryKey: ['environments', { projectId, limit, offset }],
    queryFn: () => getEnvironments({ projectId, limit, offset }),
  });
}

type UseEnvironment = PageParams & {
  projectId: string;
  queryConfig?: QueryConfig<typeof getEnvironmentsQueryOptions>;
};

export const useEnvironments = ({ projectId, queryConfig, ...page }: UseEnvironment) => {
  return useQuery({
    ...getEnvironmentsQueryOptions(projectId, page),
    placeholderData: keepPreviousData,
    ...queryConfig,
  });
};
