import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BasicInfo from "./components/BasicInfo";
import Members from "./components/Members";
import FamilyTreeApp from "./components/FamilyTree/FamilyTree";
import HonorBoard from "./components/HonorBoard";
import FundManagement from "./components/FundManagement";
import { ChevronRight, Users, Minimize2, Maximize2 } from "lucide-react";
import NotFoundPage from "@/components/shared/NotFoundPage";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setSelectedFamilyTree } from "@/stores/slices/familyTreeMetaDataSlice";
import Invitations from "./components/Invitations";
import ManagePermissions from "./components/Permissions";
import ftauthorizationService from "@/services/familyTreeAuth";

const tabs = [
  { id: 'basic', label: 'THÔNG TIN CƠ BẢN' },
  { id: 'tree', label: 'GIA PHẢ' },
  { id: 'members', label: 'THÀNH VIÊN' },
  { id: 'invitations', label: 'LỜI MỜI' },
  { id: 'permissions', label: 'QUYỀN HẠN' },
  { id: 'honor-board', label: 'THÀNH TÍCH GIA TỘC' },
  { id: 'fund', label: 'QUỸ GIA TỘC' }
];

const STORAGE_KEY = 'familyTreeActiveTab';
const HEADER_MINIMIZED_KEY = 'familyTreeHeaderMinimized';

const FamilyTreePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const selectedTree = useAppSelector(state => state.familyTreeMetaData.selectedFamilyTree);

  // Get initial tab from URL params or localStorage
  const getInitialTab = (): 'basic' | 'tree' | 'members' | 'invitations' | 'permissions' | 'honor-board' | 'fund' => {
    const paramTab = searchParams.get('tab') as 'basic' | 'tree' | 'members' | 'invitations' | 'honor-board' | 'fund' | null;
    if (paramTab && tabs.some(t => t.id === paramTab)) {
      return paramTab;
    }
    try {
      const savedTab = localStorage.getItem(STORAGE_KEY) as 'basic' | 'tree' | 'members' | 'invitations' | 'permissions' | 'honor-board' | 'fund' | null;
      if (savedTab && tabs.some(t => t.id === savedTab)) {
        return savedTab;
      }
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
    }
    return 'basic';
  };

  // Get initial header minimized state from localStorage
  const getInitialHeaderState = (): boolean => {
    try {
      const saved = localStorage.getItem(HEADER_MINIMIZED_KEY);
      return saved === 'true';
    } catch (error) {
      console.error('Failed to read header state from localStorage:', error);
      return false;
    }
  };

  const [activeTab, setActiveTab] = useState<'basic' | 'tree' | 'members' | 'invitations' | 'permissions' | 'honor-board' | 'fund'>(getInitialTab());
  const [isHeaderMinimized, setIsHeaderMinimized] = useState(getInitialHeaderState());

  // Update URL and localStorage when tab changes
  const handleTabChange = (tabId: 'basic' | 'tree' | 'members' | 'invitations' | 'permissions' | 'honor-board' | 'fund') => {
    setActiveTab(tabId);
    setSearchParams({ tab: tabId });
    try {
      localStorage.setItem(STORAGE_KEY, tabId);
    } catch (error) {
      console.error('Failed to write to localStorage:', error);
    }
  };

  const handleBack = (): void => {
    dispatch(setSelectedFamilyTree(null));
    navigate('/family-trees')
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(HEADER_MINIMIZED_KEY);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  };

  useEffect(() => {
    const fetchAuths = async () => {
      const response = await ftauthorizationService.getFTAuths();
      console.log(response);
    }
    fetchAuths();
  }, [])

  // Save header minimized state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(HEADER_MINIMIZED_KEY, isHeaderMinimized.toString());
    } catch (error) {
      console.error('Failed to save header state to localStorage:', error);
    }
  }, [isHeaderMinimized]);

  const renderContent = () => {
    switch (activeTab) {
      case 'basic':
        return <BasicInfo />;
      case 'tree':
        return <FamilyTreeApp />;
      case 'members':
        return <Members />;
      case 'invitations':
        return <Invitations />;
      case 'permissions':
        return <ManagePermissions />;
      case 'honor-board':
        return <HonorBoard />;
      case 'fund':
        return <FundManagement />;
      default:
        return <NotFoundPage />;
    }
  };

  return (
    <div className="h-full bg-gray-50 px-4 sm:px-6 lg:px-8 py-4 flex flex-col">
      {/* Top row with back button and minimize button */}
      <div className=" flex items-center justify-between gap-3">
        <button
          onClick={handleBack}
          className="flex cursor-pointer items-center text-blue-600 hover:text-blue-700 text-sm font-medium transition-all duration-300 hover:translate-x-[-4px] group"
        >
          <ChevronRight className="w-4 h-4 rotate-180 mr-1 transition-transform duration-300 group-hover:translate-x-[-2px]" />
          Quay lại danh sách gia phả
        </button>

        <button
          onClick={() => setIsHeaderMinimized(!isHeaderMinimized)}
          className="px-3 py-2 hover:bg-gray-100 rounded-lg transition-all duration-300 group flex items-center gap-2 hover:scale-105 active:scale-95"
        >
          {isHeaderMinimized ? (
            <>
              <Maximize2 className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors duration-300">Mở rộng</span>
            </>
          ) : (
            <>
              <Minimize2 className="w-5 h-5 text-gray-600 group-hover:text-blue-600 transition-colors duration-300" />
              <span className="text-sm font-medium text-gray-600 group-hover:text-blue-600 transition-colors duration-300">Thu gọn</span>
            </>
          )}
        </button>
      </div>

      {/* Header with selected tree info */}
      <div className={`overflow-hidden transition-all duration-500 ease-in-out ${isHeaderMinimized
          ? 'max-h-0 opacity-0 mb-0'
          : 'max-h-32 opacity-100 mb-2'
        }`}>
        <div className={`flex items-center gap-3 transform transition-all duration-500 ${isHeaderMinimized ? 'translate-y-[-20px] scale-95' : 'translate-y-0 scale-100'
          }`}>
          <Users className="w-8 h-8 text-blue-500 transition-all duration-500" />
          <div>
            <h1 className="text-4xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 transition-all duration-500">
              Gia phả: {selectedTree?.name}
            </h1>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-2">
        <nav className="flex space-x-8 sm:space-x-12">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as 'basic' | 'tree' | 'members' | 'honor-board' | 'fund')}
              className={`py-3 px-1 border-b-2 font-semibold text-sm sm:text-base transition-colors whitespace-nowrap ${activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      {/* Content Section - flex-1 allows content to expand and scroll */}
      <div className="flex-1 overflow-hidden">
        {renderContent()}
      </div>
    </div>
  );
};

export default FamilyTreePage;