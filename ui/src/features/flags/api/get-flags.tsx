import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { PAGE_SIZE, type PageParams, type Paginated } from '../../../lib/pagination';
import { api } from '../../../lib/api-client';
import type { QueryConfig } from '../../../lib/react-query';
import type { FeatureFlagsResponse } from '../../../types/api';

export const getFlags = ({
  projectId,
  limit = PAGE_SIZE,
  offset = 0,
}: { projectId: string } & PageParams): Promise<Paginated<FeatureFlagsResponse>> => {
  return api.get(`/projects/${projectId}/flags`, { params: { limit, offset } });
};

export function getFlagsQueryOptions(
  projectId: string,
  { limit = PAGE_SIZE, offset = 0 }: PageParams = {}
) {
  return queryOptions({
    queryKey: ['flags', { projectId, limit, offset }],
    queryFn: () => getFlags({ projectId, limit, offset }),
  });
}

type UseFlagsOptions = PageParams & {
  projectId: string;
  queryConfig?: QueryConfig<typeof getFlagsQueryOptions>;
};

export const useFlags = ({ projectId, queryConfig, ...page }: UseFlagsOptions) => {
  return useQuery({
    ...getFlagsQueryOptions(projectId, page),
    placeholderData: keepPreviousData,
    ...queryConfig,
  });
};
