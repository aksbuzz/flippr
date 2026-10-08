import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CopyButton } from '../../../components/ui/CopyButton';
import { DataTable } from '../../../components/ui/DataTable';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorPanel } from '../../../components/ui/ErrorPanel';
import { PaginationControls } from '../../../components/ui/Pagination';
import { Spinner } from '../../../components/ui/Spinner';
import { PAGE_SIZE } from '../../../lib/pagination';
import { useEnvironments } from '../api/get-environments';

const SdkKey = ({ value }: { value: string }) => {
  const [revealed, setRevealed] = useState(false);
  const shown = revealed ? value : `${'•'.repeat(12)}${value.slice(-6)}`;

  return (
    <div className="flex items-center gap-4">
      <span className="font-mono">{shown}</span>
      <button
        type="button"
        className="cursor-pointer"
        onClick={() => setRevealed(r => !r)}
        aria-label={revealed ? 'Hide SDK key' : 'Reveal SDK key'}
      >
        {revealed ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
      {/* always copies the full key, regardless of masking */}
      <CopyButton text={value} />
    </div>
  );
};

export const ListEnvironments = () => {
  const params = useParams();
  const projectId = params.projectId as string;
  const [offset, setOffset] = useState(0);

  const environmentsQuery = useEnvironments({ projectId, limit: PAGE_SIZE, offset });

  if (environmentsQuery.isLoading) {
    return (
      <div className="flex h-48 w-full items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  if (environmentsQuery.isError) {
    return (
      <ErrorPanel
        title="Could not load environments"
        error={environmentsQuery.error}
        onRetry={() => environmentsQuery.refetch()}
        isRetrying={environmentsQuery.isFetching}
      />
    );
  }

  const environments = environmentsQuery.data?.data;
  if (!environments) return null;

  const pagination = environmentsQuery.data?.pagination;

  if (environments.length === 0 && offset === 0) {
    return (
      <EmptyState
        title="No environments yet"
        description='Create your first environment, e.g. "Dev" or "Production".'
      />
    );
  }

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
          {
            title: 'SDK KEY',
            field: 'sdk_key',
            Cell: ({ entry: { sdk_key } }) => <SdkKey value={sdk_key} />,
          },
        ]}
      />
      {pagination && (
        <PaginationControls
          total={pagination.total}
          limit={pagination.limit}
          offset={pagination.offset}
          count={environments.length}
          onChange={setOffset}
          disabled={environmentsQuery.isFetching}
        />
      )}
    </div>
  );
};
