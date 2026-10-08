import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './Button';

type PaginationProps = {
  total: number;
  limit: number;
  offset: number;
  /** Number of items actually on the current page. */
  count: number;
  onChange: (offset: number) => void;
  disabled?: boolean;
  compact?: boolean;
};

export const PaginationControls = ({
  total,
  limit,
  offset,
  count,
  onChange,
  disabled,
  compact,
}: PaginationProps) => {
  if (total <= limit && offset === 0) return null;

  const from = count === 0 ? 0 : offset + 1;
  const to = offset + count;
  const hasPrev = offset > 0;
  const hasNext = offset + limit < total;

  return (
    <div className="mt-3 flex items-center justify-between gap-2 text-sm text-[#475467]">
      <span>
        {from}-{to} of {total}
      </span>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={disabled || !hasPrev}
          onClick={() => onChange(Math.max(0, offset - limit))}
          aria-label="Previous page"
        >
          {compact ? <ChevronLeft className="size-4" /> : 'Previous'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          disabled={disabled || !hasNext}
          onClick={() => onChange(offset + limit)}
          aria-label="Next page"
        >
          {compact ? <ChevronRight className="size-4" /> : 'Next'}
        </Button>
      </div>
    </div>
  );
};
