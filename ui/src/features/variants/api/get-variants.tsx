import { queryOptions, useQuery } from '@tanstack/react-query';
import { api } from '../../../lib/api-client';
import type { FlagVariant } from '../../../types/api';
import type { QueryConfig } from '../../../lib/react-query';

export const getVariants = ({ flagId }: { flagId: string }): Promise<{ data: FlagVariant[] }> => {
  return api.get(`/flags/${flagId}/variants`);
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
