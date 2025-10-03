import { Outlet } from "react-router-dom";
import { MainLayout } from "../../components/layouts/MainLayout";

export const ErrorBoundary = () => {
  return <div>Something went wrong!</div>;
};

const AppRoot = () => {
  return (
    <MainLayout>
      <Outlet />
    </MainLayout>
  );
};

export default AppRoot;
