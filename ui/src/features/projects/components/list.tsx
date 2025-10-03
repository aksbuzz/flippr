// import { Settings2 } from 'lucide-react';
// import { Chip } from '../../../components/ui/Chip';
import { DataTable } from '../../../components/ui/DataTable';
import { Spinner } from '../../../components/ui/Spinner';
import { useProjects } from '../api/get-projects';
// import { Button } from '../../../components/ui/Button';

export const ListProjects = () => {
  const projectsQuery = useProjects();

  if (projectsQuery.isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  const projects = projectsQuery.data?.data;
  // TODO: show no projects available state
  if (!projects) return null;

  return (
    <div className="container mx-auto py-8">
      <DataTable
        data={projects}
        columns={[
          {
            title: 'NAME',
            field: 'name',
            Cell: ({ entry: { name } }) => <span className="font-semibold">{name}</span>,
          },
          // TODO: add total environment, total flags, etc.
        ]}
      />
    </div>
  );
};
