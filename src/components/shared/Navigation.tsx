import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  User,
  HelpCircle,
  LogOut,
  UserCircle,
  Bell,
  Settings,
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { Link, useNavigate } from 'react-router-dom';
import logo from '@/assets/img/logo.svg';
import { logout } from '@/stores/slices/authSlice';
import userService from '@/services/userService';
import NotificationPopup from './NotificationPopup';
import { markAllRead } from '@/stores/slices/notificationSlice';

interface NavigationProps {
  onMenuClick: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ onMenuClick }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { minimizeHeader } = useAppSelector((state) => state.settings);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

  const [userData, setUserData] = useState({ name: '', picture: '' });
  const { unreadCount } = useAppSelector(state => state.notifications);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await userService.getProfileData();
        setUserData(pre => ({
          ...pre,
          name: response.data.name,
          picture: response.data.picture
        }));
      } catch (error) {
        console.log(error);
      }
    };
    fetchInitialData();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  const handleLogout = async () => {
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  const handleNotificationClick = () => {
    const willOpen = !isNotificationOpen;
    setIsNotificationOpen(willOpen);
    setIsDropdownOpen(false); // Close user dropdown if open

    if (willOpen) {
      dispatch(markAllRead());
    }
  };

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="mx-auto px-4">
        <div className={`flex items-center justify-between transition-all duration-300 ${minimizeHeader ? 'h-12' : 'h-16'}`}>
          {/* Left side */}
          <div className="flex items-center space-x-4">
            <button onClick={onMenuClick} className="p-2 rounded-md hover:bg-blue-700">
              <Menu size={minimizeHeader ? 20 : 24} />
            </button>
            <Link to="/" className="flex items-center space-x-2 ml-4">
              <img src={logo} alt="Logo" className={minimizeHeader ? "h-6 w-6" : "h-8 w-8"} />
              <span className={minimizeHeader ? "text-base font-semibold" : "text-lg font-semibold"}>ỨNG DỤNG GIA PHẢ</span>
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-3">
            {/* Notification Button */}
            <button
              ref={notificationButtonRef}
              onClick={handleNotificationClick}
              className="relative p-2 rounded-md hover:bg-blue-700 transition-colors"
              title="Thông báo"
            >
              <Bell size={minimizeHeader ? 18 : 20} />
              {/* badge: keep original small dot when 0, show count when >0 */}
              {unreadCount > 0 ? (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full px-1.5 border-2 border-blue-600">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              ) : (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full border-2 border-blue-600"></span>
              )}
            </button>

            {/* User Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen);
                  setIsNotificationOpen(false); // Close notification popup if open
                }}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-blue-700 transition-colors"
              >
                {
                  userData.picture ?
                    <img src={userData.picture} alt="Avatar" className={minimizeHeader ? 'w-[24px] h-[24px] rounded-full' : 'w-[30px] h-[30px] rounded-full'} />
                    :
                    <User size={minimizeHeader ? 18 : 20} />
                }
                {!minimizeHeader && <span className="ml-2">{userData?.name || 'User'}</span>}
              </button>
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-md shadow-lg py-2 z-50 text-gray-800">
                  <Link
                    to="/dashboard"
                    className="flex items-center px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    <UserCircle size={20} className="mr-3" />
                    Tài khoản của bạn
                  </Link>
                  <Link
                    to="/settings"
                    className="flex items-center px-4 py-2 text-sm hover:bg-gray-100"
                    onClick={() => setIsDropdownOpen(false)}
                  >
                    <Settings size={20} className="mr-3" />
                    Cài đặt
                  </Link>
                  <button className="w-full text-left flex items-center px-4 py-2 text-sm hover:bg-gray-100">
                    <HelpCircle size={20} className="mr-3" />
                    Trợ giúp và hỗ trợ
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left flex items-center px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                  >
                    <LogOut size={20} className="mr-3" />
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notification Popup */}
      {notificationButtonRef.current && (
        <NotificationPopup
          isOpen={isNotificationOpen}
          onClose={() => setIsNotificationOpen(false)}
          anchorRef={notificationButtonRef}
        />
      )}
    </header>
  );
};

export default Navigation;
