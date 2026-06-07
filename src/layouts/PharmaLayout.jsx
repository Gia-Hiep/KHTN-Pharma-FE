// File: src/layouts/PharmaLayout.jsx
import { Outlet } from 'react-router-dom';
import { SideNav } from './components/SideNav';
import { TopBar } from './components/TopBar';

export function PharmaLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <SideNav variant="pharma" />
      <div className="flex flex-1 flex-col min-h-screen transition-all duration-300" style={{ marginLeft: 'var(--sidebar-width)' }}>
        <TopBar title="Quản lý nhà thuốc" />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
