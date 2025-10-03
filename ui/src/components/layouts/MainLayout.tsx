import { Files, Flag, Home, Settings } from 'lucide-react';
import type React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { cn } from '../../utils/cn';

const Logo = () => {
  return (
    <Link to="/">
      {/* <img src="" alt="" /> */}
      <span className="text-xl font-semibold text-primary">Flippr</span>
    </Link>
  );
};

export function MainLayout({ children }: { children: React.ReactNode }) {
  const navigation = [
    { name: 'Dashboard', to: '/', icon: Home },
    { name: 'Projects', to: '/projects', icon: Files },
    { name: 'Flags', to: '/flags', icon: Flag },
    { name: 'Environments', to: '/environments', icon: Settings },
  ];

  return (
    <div className="flex min-h-screen w-full flex-col bg-content-bg">
      <aside className="fixed inset-y-0 left-0 z-10 hidden w-60 flex-col border-r bg-white border-r-gray-200 sm:flex">
        <nav className="flex flex-col items-center gap-2 px-4 py-4">
          <div className="flex h-16 shrink-0 items-center px-2">
            <Logo />
          </div>
          {navigation.map(item => (
            <NavLink
              key={item.name}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'group hover:bg-secondary',
                  'group flex flex-1 w-full text-dark items-center rounded-md p-2 text-base font-medium',
                  isActive && 'bg-secondary'
                )
              }
            >
              <item.icon
                className={cn('text-dark/60', 'mr-4 size-6 shrink-0')}
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-60">
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
          {children}
        </main>
      </div>
    </div>
  );
}
