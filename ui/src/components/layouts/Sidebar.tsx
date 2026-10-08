import { useQueryClient } from '@tanstack/react-query';
import { Home, LogOut } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { clearToken, useAuth } from '../../lib/auth';
import { cn } from '../../utils/cn';

const Logo = () => {
  return (
    <Link to="/">
      {/* <img src="" alt="" /> */}
      <span className="text-xl font-semibold text-primary">Flippr</span>
    </Link>
  );
};

export function Sidebar({ children }: { children: ReactNode }) {
  const { token } = useAuth();
  const queryClient = useQueryClient();

  function handleSignOut() {
    clearToken();
    void queryClient.invalidateQueries();
  }

  return (
    <nav className="flex flex-col items-center gap-2 px-4 py-4">
      <div className="flex h-16 shrink-0 items-center px-2">
        <Logo />
      </div>

      {/* Dashboard */}
      <NavLink
        to="/"
        end
        className={({ isActive }) =>
          cn(
            'group hover:bg-secondary',
            'group flex flex-1 w-full text-dark items-center rounded-md p-2 text-base font-medium',
            isActive && 'bg-secondary'
          )
        }
      >
        <Home className={cn('text-dark/60', 'mr-4 size-6 shrink-0')} aria-hidden="true" />
        Dashboard
      </NavLink>

      {children}

      {token && (
        <button
          type="button"
          onClick={handleSignOut}
          className="mt-4 flex w-full cursor-pointer items-center rounded-md p-2 text-sm font-medium text-dark hover:bg-secondary"
        >
          <LogOut className="mr-4 size-5 shrink-0 text-dark/60" aria-hidden="true" />
          Sign out
        </button>
      )}
    </nav>
  );
}
