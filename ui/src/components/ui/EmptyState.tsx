import type { ReactNode } from 'react';

export const EmptyState = ({ title, description }: { title: string; description?: ReactNode }) => (
  <div className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-10 text-center">
    <h2 className="text-sm font-semibold text-dark">{title}</h2>
    {description && <p className="text-sm text-[#475467]">{description}</p>}
  </div>
);
