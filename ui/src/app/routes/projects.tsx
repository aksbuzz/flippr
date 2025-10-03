import { QueryClient } from '@tanstack/react-query';

import { ContentLayout } from '../../components/layouts/ContentLayout';
import { getProjectsQueryOptions } from '../../features/projects/api/get-projects';
import { CreateProject } from '../../features/projects/components/create';
import { ListProjects } from '../../features/projects/components/list';

// eslint-disable-next-line react-refresh/only-export-components
export const clientLoader = (queryClient: QueryClient) => () => async () => {
  const query = getProjectsQueryOptions();
  return queryClient.getQueryData(query.queryKey) ?? (await queryClient.fetchQuery(query));
};

const ProjectsRoutes = () => {
  return (
    <ContentLayout title="Projects" subTitle="Manage your projects">
      <div className="flex justify-end">
        <CreateProject />
      </div>
      <div className="mt-4">
        <ListProjects />
      </div>
    </ContentLayout>
  );
};

export default ProjectsRoutes;
