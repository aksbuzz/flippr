import { DataTable } from '../../../components/ui/DataTable';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ErrorPanel } from '../../../components/ui/ErrorPanel';
import { Spinner } from '../../../components/ui/Spinner';
import { formatDate } from '../../../utils/format';
import { useVariants } from '../api/get-variants';

export const ListVariants = ({ flagId }: { flagId: string }) => {
  const variantsQuery = useVariants({ flagId });
  if (variantsQuery.isLoading) {
    return (
      <div className="flex h-16 w-full items-center justify-center">
        <Spinner size="md" />
      </div>
    );
  }

  if (variantsQuery.isError) {
    return (
      <ErrorPanel
        title="Could not load variants"
        error={variantsQuery.error}
        onRetry={() => variantsQuery.refetch()}
        isRetrying={variantsQuery.isFetching}
      />
    );
  }

  const variants = variantsQuery.data?.data;
  if (!variants) return null;

  if (variants.length === 0) {
    return (
      <div className="py-2">
        <EmptyState title="No variants yet" description="Create a variant to serve this flag." />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-2">
      <DataTable
        columns={[
          {
            title: 'NAME',
            field: 'key',
            Cell: ({ entry: { key } }) => <span className="font-semibold">{key}</span>,
          },
          {
            title: 'VALUE',
            field: 'value',
            Cell: ({ entry: { value } }) => <pre>{JSON.stringify(value, null, 2)}</pre>,
          },
          {
            title: 'CREATED AT',
            field: 'created_at',
            Cell: ({ entry: { created_at } }) => <span>{formatDate(created_at)}</span>,
          },
        ]}
        data={variants}
      />
    </div>
  );
};
