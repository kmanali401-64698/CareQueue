import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useClinic } from '../../context/ClinicContext';

export function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { isLoading } = useClinic();

  return (
    <div className="min-h-screen bg-surface-muted flex">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0 transition-all">
        <TopBar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {isLoading ? (
            <div className="py-24 flex justify-center">
              <LoadingSpinner size="lg" message="Loading clinic data..." />
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
