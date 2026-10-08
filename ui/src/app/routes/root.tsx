import { Outlet, useRevalidator, useRouteError } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { ErrorPanel } from '../../components/ui/ErrorPanel';
import { MainLayout } from '../../components/layouts/MainLayout';
import { Sidebar } from '../../components/layouts/Sidebar';
import { ListProjects } from '../../features/projects/components/list';

export const ErrorBoundary = () => {
  const error = useRouteError();
  const revalidator = useRevalidator();

  // Route errors keep the surrounding layout (this boundary is rendered inside it).
  return (
    <div className="mx-auto w-full max-w-3xl py-8">
      <ErrorPanel
        title="Something went wrong"
        error={error}
        onRetry={() => revalidator.revalidate()}
        isRetrying={revalidator.state === 'loading'}
      />
      <div className="mt-3 flex justify-center">
        <Button variant="tertiary" size="sm" onClick={() => window.location.reload()}>
          Reload page
        </Button>
      </div>
    </div>
  );
};

const AppRoot = () => {
  return (
    <MainLayout
      sidebar={
        <Sidebar>
          <ListProjects />
        </Sidebar>
      }
    >
      <Outlet />
    </MainLayout>
  );
};

export default AppRoot;
