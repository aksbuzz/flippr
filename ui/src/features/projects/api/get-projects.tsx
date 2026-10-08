import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query';
import { PAGE_SIZE, type PageParams, type Paginated } from '../../../lib/pagination';
import type { QueryConfig } from '../../../lib/react-query';
import { api } from '../../../lib/api-client';
import type { Project } from '../../../types/api';

export const getProjects = ({
  limit = PAGE_SIZE,
  offset = 0,
}: PageParams = {}): Promise<Paginated<Project>> => {
  return api.get(`/projects`, { params: { limit, offset } });
};

export function getProjectsQueryOptions({ limit = PAGE_SIZE, offset = 0 }: PageParams = {}) {
  return queryOptions({
    queryKey: ['projects', { limit, offset }],
    queryFn: () => getProjects({ limit, offset }),
  });
}

type UseProjectsOptions = PageParams & {
  queryConfig?: QueryConfig<typeof getProjectsQueryOptions>;
};

export const useProjects = ({ queryConfig, ...page }: UseProjectsOptions = {}) => {
  return useQuery({
    ...getProjectsQueryOptions(page),
    placeholderData: keepPreviousData,
    ...queryConfig,
  });
};
