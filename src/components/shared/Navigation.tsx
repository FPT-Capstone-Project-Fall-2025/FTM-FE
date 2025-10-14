import React, { useState, useRef, useEffect } from 'react';
import {
  Menu,
  User,
  HelpCircle,
  LogOut,
  UserCircle,
  Bell,
  ChevronRight,
  Sun,
  Moon,
} from 'lucide-react';
import { useAppDispatch } from '@/hooks/redux';
import { Link, useNavigate } from 'react-router-dom';
import logo from '@/assets/img/logo.svg';
import { logout } from '@/stores/slices/authSlice';
import userService from '@/services/userService';

interface NavigationProps {
  onMenuClick: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ onMenuClick }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [userData, setUserData] = useState({ name: '', picture: '' });

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await userService.getProfileData();
        setUserData(pre => ({
          ...pre,
          name: response.data.name,
          picture: response.data.picture
        }))
      } catch (error) {
        console.log(error);
      }
    }
    fetchInitialData();
  }, [])

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
    dispatch(logout())
    navigate('/login', { replace: true })
  }

  return (
    <header className="bg-blue-600 text-white shadow-md">
      <div className="mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Left side */}
          <div className="flex items-center space-x-4">
            <button onClick={onMenuClick} className="p-2 rounded-md hover:bg-blue-700">
              <Menu size={24} />
            </button>
            <Link to="/" className="flex items-center space-x-2 ml-4">
              <img src={logo} alt="Logo" className="h-8 w-8" />
              <span className="text-lg font-semibold">ỨNG DỤNG GIA PHẢ</span>
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 p-2 rounded-md hover:bg-blue-700"
              >
                {
                  userData.picture ?
                    <img src={userData.picture} alt="Avatar" className='w-[30px] h-[30px] rounded-full' />
                    :
                    <User size={20} />
                }
                <span className="ml-2">{userData?.name || 'User'}</span>
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
                  <button className="w-full text-left flex items-center px-4 py-2 text-sm hover:bg-gray-100">
                    <Bell size={20} className="mr-3" />
                    Thông báo
                  </button>
                  <button className="w-full text-left flex items-center px-4 py-2 text-sm hover:bg-gray-100">
                    <HelpCircle size={20} className="mr-3" />
                    Trợ giúp và hỗ trợ
                  </button>
                  <button className="w-full text-left flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100">
                    <div className="flex items-center">
                      <HelpCircle size={20} className="mr-3" />
                      Ngôn ngữ
                    </div>
                    <div className="flex items-center text-gray-500">
                      Tiếng Việt
                      <ChevronRight size={16} className="ml-1" />
                    </div>
                  </button>
                  <div className="flex items-center justify-between px-4 py-2 text-sm">
                    <div className="flex items-center">
                      {isDarkMode ? (
                        <Moon size={20} className="mr-3" />
                      ) : (
                        <Sun size={20} className="mr-3" />
                      )}
                      Chủ đề
                    </div>
                    <div
                      className={`w-12 h-6 flex items-center rounded-full p-1 cursor-pointer ${isDarkMode ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      onClick={() => setIsDarkMode(!isDarkMode)}
                    >
                      <div
                        className={`bg-white w-4 h-4 rounded-full shadow-md transform duration-300 ease-in-out ${isDarkMode ? 'translate-x-6' : ''
                          }`}
                      ></div>
                    </div>
                  </div>
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
    </header>
  );
};

export default Navigation;
