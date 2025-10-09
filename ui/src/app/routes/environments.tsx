import { QueryClient } from '@tanstack/react-query';

import { ContentLayout } from '../../components/layouts/ContentLayout';
import { CreateEnvironment } from '../../features/environments/components/create';
import { ListEnvironments } from '../../features/environments/components/list';
import { getEnvironmentsQueryOptions } from '../../features/environments/api/get-environments';
import type { LoaderFunctionArgs } from 'react-router';
import { useDocumentTitle } from '../../hooks';

// eslint-disable-next-line react-refresh/only-export-components
export const clientLoader =
  (queryClient: QueryClient) =>
  () =>
  async ({ params }: LoaderFunctionArgs) => {
    const projectId = params.projectId as string;

    const query = getEnvironmentsQueryOptions(projectId);
    return queryClient.getQueryData(query.queryKey) ?? (await queryClient.fetchQuery(query));
  };

const EnvironmentsRoutes = () => {
  useDocumentTitle('Flippr - Environments');

  return (
    <ContentLayout title="Environments" subTitle="Manage your environments">
      <div className="flex justify-end">
        <CreateEnvironment />
      </div>
      <div className="mt-4">
        <ListEnvironments />
      </div>
    </ContentLayout>
  );
};

export default EnvironmentsRoutes;
