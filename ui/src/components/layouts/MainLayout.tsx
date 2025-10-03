import type { PropsWithChildren, ReactNode } from "react";

type MainLayoutProps = PropsWithChildren<{
  sidebar?: ReactNode;
}>;

export function MainLayout({ children, sidebar }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-content-bg">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-white border-r-gray-200 sm:flex">
        {sidebar}
      </aside>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-60">
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}
