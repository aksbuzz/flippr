import type { QueryClient } from '@tanstack/react-query';
import { useParams, type LoaderFunctionArgs } from 'react-router-dom';
import { ContentLayout } from '../../components/layouts/ContentLayout';
import { Spinner } from '../../components/ui/Spinner';
import { Tabs } from '../../components/ui/Tabs';
import { getFlagQueryOptions, useFlag } from '../../features/flags/api/get-flag';
import { ViewFlag } from '../../features/flags/components/view';
import { CreateVariant } from '../../features/variants/components/create';
import { ListVariants } from '../../features/variants/components/list';
import { useDocumentTitle } from '../../hooks';
import { ListEnvironmentMapping } from '../../features/flags/components/environments-mapping';

// eslint-disable-next-line react-refresh/only-export-components
export const clientLoader =
  (queryClient: QueryClient) =>
  () =>
  async ({ params }: LoaderFunctionArgs) => {
    const projectId = params.projectId as string;
    const flagId = params.flagId as string;

    const query = getFlagQueryOptions(projectId, flagId);
    return queryClient.getQueryData(query.queryKey) ?? (await queryClient.fetchQuery(query));
  };

const FlagRoutes = () => {
  const params = useParams();
  const projectId = params.projectId as string;
  const flagId = params.flagId as string;

  const flagQuery = useFlag({ projectId, flagId });

  useDocumentTitle(`Flippr - Flag - ${flagQuery?.data?.data?.name || ''}`);

  if (flagQuery.isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  const flag = flagQuery.data?.data;

  if (!flag) return null;

  return (
    <ContentLayout
      title={`Flags / ${flag.name}`}
      subTitle={`Manage your flag variants and environments`}
    >
      <ViewFlag flag={flag} />
      <div className="mt-4">
        <Tabs
          tabs={[
            {
              label: 'Variants',
              content: (
                <>
                  <div className="flex justify-end">
                    <CreateVariant flagId={flag.id} flagType={flag.flag_type} />
                  </div>
                  <ListVariants flagId={flag.id} />
                </>
              ),
            },
            {
              label: 'Environment Mapping',
              content: (
                <>
                  <ListEnvironmentMapping flag={flag} />
                </>
              ),
            },
          ]}
        />
      </div>
    </ContentLayout>
  );
};

export default FlagRoutes;
