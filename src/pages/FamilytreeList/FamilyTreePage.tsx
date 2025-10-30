import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BasicInfo from "./components/BasicInfo";
import Members from "./components/Members";
import FamilyTreeApp from "./components/FamilyTree/FamilyTree";
import HonorBoard from "./components/HonorBoard";
import { ChevronRight, Users } from "lucide-react";
import NotFoundPage from "@/components/shared/NotFoundPage";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setSelectedFamilyTree } from "@/stores/slices/familyTreeMetaDataSlice";

const tabs = [
  { id: 'basic', label: 'THÔNG TIN CƠ BẢN' },
  { id: 'tree', label: 'GIA PHẢ' },
  { id: 'members', label: 'THÀNH VIÊN' },
  { id: 'honor-board', label: 'BẢNG VINH DANH' }
];

const STORAGE_KEY = 'familyTreeActiveTab';

const FamilyTreePage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const selectedTree = useAppSelector(state => state.familyTreeMetaData.selectedFamilyTree);

  // Get initial tab from URL params or localStorage
  const getInitialTab = (): 'basic' | 'tree' | 'members' | 'honor-board' => {
    const paramTab = searchParams.get('tab') as 'basic' | 'tree' | 'members' | 'honor-board' | null;
    if (paramTab && tabs.some(t => t.id === paramTab)) {
      return paramTab;
    }
    try {
      const savedTab = localStorage.getItem(STORAGE_KEY) as 'basic' | 'tree' | 'members' | 'honor-board' | null;
      if (savedTab && tabs.some(t => t.id === savedTab)) {
        return savedTab;
      }
    } catch (error) {
      console.error('Failed to read from localStorage:', error);
    }
    return 'basic';
  };

  const [activeTab, setActiveTab] = useState<'basic' | 'tree' | 'members' | 'honor-board'>(getInitialTab());

  // Update URL and localStorage when tab changes
  const handleTabChange = (tabId: 'basic' | 'tree' | 'members' | 'honor-board') => {
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
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'basic':
        return <BasicInfo />;
      case 'tree':
        return <FamilyTreeApp />;
      case 'members':
        return <Members />;
      case 'honor-board':
        return <HonorBoard />;
      default:
        return <NotFoundPage />;
    }
  };

  return (
    <div className="h-full bg-gray-50 px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
      <div className="mb-4">
        <button
          onClick={handleBack}
          className="flex cursor-pointer items-center text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          <ChevronRight className="w-4 h-4 rotate-180 mr-1" />
          Quay lại danh sách gia phả
        </button>
      </div>
      {/* Header with selected tree info */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Users className="w-8 h-8 text-blue-500" />
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Gia phả: {selectedTree?.name}
            </h1>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="flex space-x-8 sm:space-x-12">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id as 'basic' | 'tree' | 'members' | 'honor-board')}
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
      {/* Content Section */}
      {renderContent()}
    </div>
  );
};

export default FamilyTreePage;