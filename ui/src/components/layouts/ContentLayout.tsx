import type React from 'react';

type ContentLayoutProps = {
  children: React.ReactNode;
  title: string;
  subTitle?: string;
};

export const ContentLayout = ({ children, title, subTitle }: ContentLayoutProps) => {
  return (
    <>
      <div className="py-4">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
          <h1 className="text-base font-semibold text-dark">{title}</h1>
          {subTitle && <h3 className="text-xs text-[#475467]">{subTitle}</h3>}
        </div>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">{children}</div>
      </div>
    </>
  );
};
