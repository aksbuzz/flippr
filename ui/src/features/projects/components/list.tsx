import { Flag, Folder, Settings } from 'lucide-react';
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { ErrorPanel } from '../../../components/ui/ErrorPanel';
import { PaginationControls } from '../../../components/ui/Pagination';
import { PAGE_SIZE } from '../../../lib/pagination';
import { cn } from '../../../utils/cn';
import { useProjects } from '../api/get-projects';
import { CreateProject } from './create';

export const ListProjects = () => {
  const location = useLocation();
  const [offset, setOffset] = useState(0);
  const projectsQuery = useProjects({ limit: PAGE_SIZE, offset });

  if (projectsQuery.isLoading) {
    return <div className="px-2 text-sm text-gray-500">Loading projects...</div>;
  }

  const projects = projectsQuery.data?.data;
  const pagination = projectsQuery.data?.pagination;

  return (
    <div className="py-2 w-full">
      <div className="mb-2 flex items-center justify-between">
        <span className="ml-2 text-xs font-semibold uppercase text-gray-500">Projects</span>
        <CreateProject />
      </div>

      {projectsQuery.isError && (
        <ErrorPanel
          title="Could not load projects"
          error={projectsQuery.error}
          onRetry={() => projectsQuery.refetch()}
          isRetrying={projectsQuery.isFetching}
        />
      )}

      {projects && projects.length === 0 && offset === 0 && (
        <div className="px-2 text-sm text-gray-500">No projects yet. Use + to create one.</div>
      )}

      <div className="flex flex-col gap-1">
        {(projects ?? []).map(project => {
          const isProjectActive = location.pathname.startsWith(`/projects/${project.id}`);

          return (
            <div key={project.id}>
              <NavLink
                to={`/projects/${project.id}/flags`}
                className={
                  'group flex flex-1 w-full items-center rounded-md p-2 text-base font-medium text-dark hover:bg-secondary'
                }
              >
                <Folder className="mr-4 size-6 shrink-0 text-dark/60" />
                {project.name}
              </NavLink>

              {/* Show nested links only if the project section is active */}
              {isProjectActive && (
                <div className="mt-1 flex flex-col gap-1 pl-5">
                  <NavLink
                    to={`/projects/${project.id}/flags`}
                    end
                    className={({ isActive }) =>
                      cn(
                        'group flex w-full items-center rounded-md py-2 pl-2 pr-2 text-sm font-medium text-dark hover:bg-secondary',
                        isActive && 'bg-secondary'
                      )
                    }
                  >
                    <Flag className="mr-3 size-5 shrink-0 text-dark/60" />
                    Flags
                  </NavLink>
                  <NavLink
                    to={`/projects/${project.id}/environments`}
                    className={({ isActive }) =>
                      cn(
                        'group flex w-full items-center rounded-md py-2 pl-2 pr-2 text-sm font-medium text-dark hover:bg-secondary',
                        isActive && 'bg-secondary'
                      )
                    }
                  >
                    <Settings className="mr-3 size-5 shrink-0 text-dark/60" />
                    Environments
                  </NavLink>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {pagination && projects && (
        <PaginationControls
          compact
          total={pagination.total}
          limit={pagination.limit}
          offset={pagination.offset}
          count={projects.length}
          onChange={setOffset}
          disabled={projectsQuery.isFetching}
        />
      )}
    </div>
  );
};
