import { useState, useEffect } from 'react';
import Navigation from '../shared/Navigation';
import Sidebar from '../shared/Sidebar';
import type { LayoutProps } from '@/types/common';

const MainLayout: React.FC<LayoutProps> = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const savedState = localStorage.getItem('sidebarCollapsed');
    return savedState ? JSON.parse(savedState) : false;
  });

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  return (
    <div className="h-screen flex flex-col">
      <Navigation onMenuClick={toggleSidebar} />
      <div className="h-full grow overflow-hidden flex">
        <Sidebar isCollapsed={isSidebarCollapsed} />
        <main className="h-full grow">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;