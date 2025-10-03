import type { FC, ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './Table';

export interface ColumnDef<TData> {
  title: ReactNode;
  field: keyof TData;
  align?: 'left' | 'center' | 'right';
  Cell?: FC<{ entry: TData }>;
}

interface DataTableProps<TData> {
  data: TData[];
  columns: ColumnDef<TData>[];
}

function getAlignmentClass(align?: 'left' | 'center' | 'right') {
  if (align === 'center') return 'text-center';
  if (align === 'right') return 'text-right';

  return 'text-left';
}

export function DataTable<TData extends { id: string | number }>({
  data,
  columns,
}: DataTableProps<TData>) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((column, index) => (
              <TableHead key={index} className={getAlignmentClass(column.align)}>
                {column.title}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map(row => (
              <TableRow key={row.id}>
                {columns.map((column, colIndex) => (
                  <TableCell key={colIndex} className={getAlignmentClass(column.align)}>
                    {column.Cell ? <column.Cell entry={row} /> : String(row[column.field] ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                {/* TODO: add a proper empty state component */}
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
