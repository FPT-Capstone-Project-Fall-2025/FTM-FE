import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbItem {
  label: string;
  path?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbNavigationProps {
  customItems?: BreadcrumbItem[];
  showHome?: boolean;
}

const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  customItems,
  showHome = true,
}) => {
  const location = useLocation();
  
  // Default breadcrumb generation from URL path
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = location.pathname.split('/').filter(segment => segment);
    
    const breadcrumbs: BreadcrumbItem[] = [];
    
    if (showHome) {
      breadcrumbs.push({
        label: 'Trang chủ',
        path: '/',
        icon: <Home className="w-4 h-4" />,
      });
    }

    pathSegments.forEach((segment, index) => {
      const path = '/' + pathSegments.slice(0, index + 1).join('/');
      let label = segment;

      // Mapping common path segments to Vietnamese labels
      const pathLabels: Record<string, string> = {
        'dashboard': 'Trang chủ',
        'admin': 'Quản trị',
        'users': 'Người dùng',
        'profile': 'Hồ sơ cá nhân',
        'settings': 'Cài đặt',
        'family': 'Gia phả',
        'genealogy': 'Gia phả',
        'activities': 'Hoạt động',
      };

      label = pathLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);
      
      const breadcrumbItem: BreadcrumbItem = {
        label,
      };
      
      // Only add path if it's not the last item
      if (index < pathSegments.length - 1) {
        breadcrumbItem.path = path;
      }
      
      breadcrumbs.push(breadcrumbItem);
    });

    return breadcrumbs;
  };

  const breadcrumbs = customItems || generateBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null; // Don't show breadcrumbs if there's only home or less
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-6">
      {breadcrumbs.map((item, index) => (
        <div key={index} className="flex items-center">
          {index > 0 && (
            <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
          )}
          
          {item.path ? (
            <Link
              to={item.path}
              className="flex items-center space-x-1 hover:text-blue-600 transition-colors"
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          ) : (
            <div className="flex items-center space-x-1 text-gray-900 font-medium">
              {item.icon}
              <span>{item.label}</span>
            </div>
          )}
        </div>
      ))}
    </nav>
  );
};

export default BreadcrumbNavigation;