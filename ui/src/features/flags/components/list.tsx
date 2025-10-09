import { Settings } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Chip } from '../../../components/ui/Chip';
import { DataTable } from '../../../components/ui/DataTable';
import { Spinner } from '../../../components/ui/Spinner';
import { useFlags } from '../api/get-flags';

export const ListFlags = () => {
  const navigate = useNavigate();
  const params = useParams();

  const projectId = params.projectId as string;
  const flagsQuery = useFlags({ projectId });

  if (flagsQuery.isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  const flags = flagsQuery.data?.data;
  if (!flags) return null;

  return (
    <div className="container mx-auto py-8">
      <DataTable
        data={flags.map(flag => ({
          ...flag,
          enabledCount: flag.environments.reduce((acc, curr) => acc + (curr.is_enabled ? 1 : 0), 0),
        }))}
        columns={[
          {
            title: 'NAME',
            field: 'name',
            Cell: ({ entry: { name } }) => <span className="font-semibold">{name}</span>,
          },
          {
            title: 'KEY',
            field: 'key',
          },
          {
            title: 'FLAG TYPE',
            field: 'flag_type',
            Cell: ({ entry: { flag_type } }) => (
              <span>{flag_type.charAt(0).toUpperCase() + flag_type.slice(1)}</span>
            ),
          },
          {
            title: 'STATUS',
            field: 'enabledCount',
            align: 'center',
            Cell: ({ entry: { enabledCount, environments } }) => (
              <Chip>
                {enabledCount === 0
                  ? 'Disabled in all environments'
                  : `Enabled in ${enabledCount}/${environments.length} environments`}
              </Chip>
            ),
          },
          {
            title: 'ACTION',
            field: 'id',
            align: 'center',
            Cell: ({ entry: { id } }) => (
              <Button
                size="icon"
                variant="secondary"
                className="border-0"
                onClick={() => navigate(`/projects/${projectId}/flags/${id}`)}
              >
                <Settings className="cursor-pointer size-4 text-[#6B7280]" />
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
};
