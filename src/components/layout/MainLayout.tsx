import { useState, useEffect } from 'react';
import Navigation from '../shared/Navigation';
import Sidebar from '../shared/Sidebar';
import type { LayoutProps } from '@/types/common';

const MainLayout: React.FC<LayoutProps> = ({children}) => {
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
    <div className="min-h-screen flex flex-col">
      <Navigation onMenuClick={toggleSidebar} />
      <div className="flex flex-grow">
        <Sidebar isCollapsed={isSidebarCollapsed} />
        <main className="flex-grow">
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;