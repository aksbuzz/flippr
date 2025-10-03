import { QueryClient } from '@tanstack/react-query';

import { ContentLayout } from '../../components/layouts/ContentLayout';
import { CreateFlag } from '../../features/flags/components/create';
import { ListFlags } from '../../features/flags/components/list';
import { getFlagsQueryOptions } from '../../features/flags/api/get-flags';
import type { LoaderFunctionArgs } from 'react-router';

// eslint-disable-next-line react-refresh/only-export-components
export const clientLoader =
  (queryClient: QueryClient) =>
  () =>
  async ({ params }: LoaderFunctionArgs) => {
    const projectId = params.projectId as unknown as number
    
    const query = getFlagsQueryOptions(projectId);

    return queryClient.getQueryData(query.queryKey) ?? (await queryClient.fetchQuery(query));
  };

const FlagsRoutes = () => {
  return (
    <ContentLayout title="Flags" subTitle='Manage your feature flags'>
      <div className="flex justify-end">
        <CreateFlag />
      </div>
      <div className="mt-4">
        <ListFlags />
      </div>
    </ContentLayout>
  );
};

export default FlagsRoutes;
