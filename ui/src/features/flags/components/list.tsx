import { Settings2 } from 'lucide-react';
import { Chip } from '../../../components/ui/Chip';
import { DataTable } from '../../../components/ui/DataTable';
import { Spinner } from '../../../components/ui/Spinner';
import { useFlags } from '../api/get-flags';
import { Button } from '../../../components/ui/Button';

export const ListFlags = () => {
  const flagsQuery = useFlags({ projectId: 1 });

  if (flagsQuery.isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  const flags = flagsQuery.data?.data;
  // TODO: show no flags available state
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
            title: 'DESCRIPTION',
            field: 'description',
          },
          {
            title: 'ENABLED IN ENVIRONMENTS',
            field: 'enabledCount',
            align: 'center',
            Cell: ({ entry: { enabledCount } }) => <Chip>{`${enabledCount}/6 enabled`}</Chip>,
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
                onClick={() => console.log(id)}
              >
                <Settings2 className="cursor-pointer size-4 text-[#6B7280]" />
              </Button>
            ),
          },
        ]}
      />
    </div>
  );
};
