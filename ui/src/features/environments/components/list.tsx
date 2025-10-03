// import { Settings2 } from 'lucide-react';
// import { Chip } from '../../../components/ui/Chip';
import { useParams } from 'react-router-dom';
import { DataTable } from '../../../components/ui/DataTable';
import { Spinner } from '../../../components/ui/Spinner';
import { useEnvironments } from '../api/get-environments';
// import { Button } from '../../../components/ui/Button';

export const ListEnvironments = () => {
  const params = useParams();
  const projectId = params.projectId as unknown as number;

  const environmentsQuery = useEnvironments({ projectId });

  if (environmentsQuery.isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  const environments = environmentsQuery.data?.data;
  // TODO: show no environments available state
  if (!environments) return null;

  return (
    <div className="container mx-auto py-8">
      <DataTable
        data={environments}
        columns={[
          {
            title: 'NAME',
            field: 'name',
            Cell: ({ entry: { name } }) => <span className="font-semibold">{name}</span>,
          },
          // TODO: add total flags, etc.
        ]}
      />
    </div>
  );
};
