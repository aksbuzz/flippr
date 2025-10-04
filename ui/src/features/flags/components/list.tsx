import { Settings2 } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Chip } from '../../../components/ui/Chip';
import { DataTable } from '../../../components/ui/DataTable';
import { Spinner } from '../../../components/ui/Spinner';
import { useFlags } from '../api/get-flags';
import { UpdateFlagState, type UpdateFlagStateProps } from './update';

export const ListFlags = () => {
  const [selectedFlagId, setSelectedFlagId] = useState<string | null>(null);

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
            title: 'DESCRIPTION',
            field: 'description',
          },
          {
            title: 'ENABLED IN ENVIRONMENTS',
            field: 'enabledCount',
            align: 'center',
            Cell: ({ entry: { enabledCount, environments } }) => (
              <Chip>{`${enabledCount}/${environments.length} enabled`}</Chip>
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
                onClick={() => setSelectedFlagId(id)}
              >
                <Settings2 className="cursor-pointer size-4 text-[#6B7280]" />
              </Button>
            ),
          },
        ]}
      />

      {selectedFlagId && (
        <UpdateFlagState
          isOpen={!!selectedFlagId}
          onClose={() => setSelectedFlagId(null)}
          data={
            flags.find(
              flag => flag.id === selectedFlagId
            ) as unknown as UpdateFlagStateProps['data']
          }
        />
      )}
    </div>
  );
};
