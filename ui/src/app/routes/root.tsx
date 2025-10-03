import { Outlet } from 'react-router-dom';
import { MainLayout } from '../../components/layouts/MainLayout';
import { Sidebar } from '../../components/layouts/Sidebar';
import { ListProjects } from '../../features/projects/components/list';

export const ErrorBoundary = () => {
  return <div>Something went wrong!</div>;
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
