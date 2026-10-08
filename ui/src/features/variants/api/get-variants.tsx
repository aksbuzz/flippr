import { queryOptions, useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';
import type { FlagVariant } from '../../../types/api';
import type { QueryConfig } from '../../../lib/react-query';

export const getVariants = ({ flagId }: { flagId: string }): Promise<{ data: FlagVariant[] }> => {
  // variants are not paged in the UI: ask for the maximum page size
  return api.get(`/flags/${flagId}/variants`, { params: { limit: 100, offset: 0 } });
};

export function getVariantsQueryOptions(flagId: string) {
  return queryOptions({
    queryKey: ['variants', { flagId }],
    queryFn: () => getVariants({ flagId }),
  })
}

type UseVariantsOptions = {
  flagId: string;
  queryConfig?: QueryConfig<typeof getVariants>;
};

export const useVariants = ({ flagId, queryConfig }: UseVariantsOptions) => {
  return useQuery({ ...getVariantsQueryOptions(flagId), ...queryConfig });
}
