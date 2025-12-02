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

import { useState, useEffect } from 'react';
import { useAppSelector } from '@/hooks/redux';
import familyTreeService from '@/services/familyTreeService';
import { getUserIdFromToken } from '@/utils/jwtUtils';

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
  const { token } = useAppSelector(state => state.auth);
  const [isGuestOnly, setIsGuestOnly] = useState(false);

  useEffect(() => {
    const checkGuestStatus = async () => {
      if (!token) return;
      const userId = getUserIdFromToken(token);
      if (!userId) return;

      try {
        const response = await familyTreeService.getMyFamilytrees();
        const trees = response.data?.data || [];

        if (trees.length === 0) {
          setIsGuestOnly(false); // No trees, default to showing everything (or nothing?)
          return;
        }

        let hasNonGuestRole = false;

        // Check each tree
        for (const tree of trees) {
          // If user is owner, they are definitely not a guest
          if (tree.ownerId === userId) {
            hasNonGuestRole = true;
            break;
          }

          // Fetch member details to check role
          try {
            const memberResponse = await familyTreeService.getFamilyTreeMembers(tree.id, {
              pageIndex: 1,
              pageSize: 1,
              propertyFilters: [
                { name: "FTId", operation: "EQUAL", value: tree.id },
                { name: "UserId", operation: "EQUAL", value: userId }
              ],
              totalItems: 0,
              totalPages: 0
            });

            if (memberResponse.data?.data && memberResponse.data.data.length > 0) {
              const role = memberResponse.data.data[0]!.ftRole;
              if (role !== 'FTGuest') {
                hasNonGuestRole = true;
                break;
              }
            }
          } catch (err) {
            console.error(`Error checking role for tree ${tree.id}:`, err);
          }
        }

        setIsGuestOnly(!hasNonGuestRole);

      } catch (error) {
        console.error('Error checking guest status:', error);
      }
    };

    checkGuestStatus();
  }, [token]);

  const filteredItems = sidebarItems.filter(item => {
    if (isGuestOnly && (item.to === '/events' || item.to === '/group')) {
      return false;
    }
    return true;
  });

  return (
    <aside
      className={`shrink-0 h-full bg-gray-900 text-white flex flex-col transition-all duration-300 ease-in-out ${isCollapsed ? 'w-20' : 'w-64'
        }`}
    >
      <div className="p-4">
        <ul className="space-y-2">
          {filteredItems.map((item, index) => (
            <li key={index}>
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center justify-center p-2 rounded-lg transition-colors ${isActive ? 'bg-blue-500 text-white' : 'hover:bg-gray-700'
                  } ${isCollapsed ? '' : ''}`
                }
              >
                <item.icon size={24} className="flex-shrink-0" />
                <span
                  className={`overflow-hidden whitespace-nowrap transition-all duration-200 ease-in-out ${isCollapsed ? 'hidden w-0 ml-0' : 'w-full ml-4'
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
