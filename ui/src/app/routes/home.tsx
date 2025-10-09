import { ContentLayout } from '../../components/layouts/ContentLayout';
import { useDocumentTitle } from '../../hooks';

const DashboardRoute = () => {
  useDocumentTitle('Flippr - Dashboard')

  return (
    <ContentLayout title="Dashboard">
      <h1 className="text-xl">Welcome to Flippr</h1>
    </ContentLayout>
  );
};

export default DashboardRoute;
