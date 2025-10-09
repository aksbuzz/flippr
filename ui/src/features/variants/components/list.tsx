import { DataTable } from '../../../components/ui/DataTable';
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

  const variants = variantsQuery.data?.data;
  if (!variants) return null;

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
