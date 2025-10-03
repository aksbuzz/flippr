import { Flag, Folder, Settings } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../../utils/cn';
import { useProjects } from '../api/get-projects';
import { CreateProject } from './create';

export const ListProjects = () => {
  const projectsQuery = useProjects();

  if (projectsQuery.isLoading) {
    return <div className="px-2 text-sm text-gray-500">Loading projects...</div>;
  }

  const projects = projectsQuery.data?.data;

  if (!projects) return <div className="px-2 text-sm text-gray-500">No projects yet.</div>;

  return (
    <div className="py-2 w-full">
      <div className="mb-2 flex items-center justify-between">
        <span className="ml-2 text-xs font-semibold uppercase text-gray-500">Projects</span>
        <CreateProject />
      </div>

      <div className="flex flex-col gap-1">
        {projects.map(project => {
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
    </div>
  );
};
