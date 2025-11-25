import {
  Home,
  User,
  LayoutGrid,
  BarChart2,
  Newspaper,
  // MessageSquare,
  Settings,
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

const sidebarItems = [
  { to: '/home', icon: Home, text: 'Trang chủ' },
  { to: '/dashboard', icon: User, text: 'Tài khoản của tôi' },
  { to: '/family-trees', icon: LayoutGrid, text: 'Quản lí gia phả' },
  { to: '/events', icon: BarChart2, text: 'Sự Kiện' },
  { to: '/group', icon: Newspaper, text: 'Tin tức' },
  // { to: '/contact', icon: MessageSquare, text: 'Liên hệ' },
  { to: '/settings', icon: Settings, text: 'Cài đặt' },
];

interface SidebarProps {
  isCollapsed: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isCollapsed }) => {
  return (
    <aside
      className={`shrink-0 h-full bg-gray-900 text-white flex flex-col transition-all duration-300 ease-in-out ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      <div className="p-4">
        <ul className="space-y-2">
          {sidebarItems.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-center p-2 rounded-lg transition-colors ${
                    isActive ? 'bg-blue-500 text-white' : 'hover:bg-gray-700'
                  } ${isCollapsed ? '' : ''}`
                }
              >
                <item.icon size={24} className="flex-shrink-0" />
                <span
                  className={`overflow-hidden whitespace-nowrap transition-all duration-200 ease-in-out ${
                    isCollapsed ? 'hidden w-0 ml-0' : 'w-full ml-4'
                  }`}
                >
                  {item.text}
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
};

export default Sidebar;
