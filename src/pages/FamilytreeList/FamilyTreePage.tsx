import { useState } from "react";
import BasicInfo from "./components/BasicInfo";
import Members from "./components/Members";
import FamilyTreeApp from "./components/FamilyTree/FamilyTree";
import { ChevronRight, Users } from "lucide-react";
import NotFoundPage from "@/components/shared/NotFoundPage";
import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import { setSelectedFamilyTree } from "@/stores/slices/familyTreeMetaDataSlice";

const tabs = [
  { id: 'basic', label: 'THÔNG TIN CƠ BẢN' },
  { id: 'tree', label: 'GIA PHẢ' },
  { id: 'members', label: 'THÀNH VIÊN' }
];

const FamilyTreePage: React.FC = () => {

  const [activeTab, setActiveTab] = useState<'basic' | 'tree' | 'members'>('basic');
  const dispatch = useAppDispatch();
  const selectedTree = useAppSelector(state => state.familyTreeMetaData.selectedFamilyTree);

  const handleBack = (): void => {
    dispatch(setSelectedFamilyTree(null));
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'basic':
        return <BasicInfo />;
      case 'tree':
        return <FamilyTreeApp />;
      case 'members':
        return <Members />;
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
              onClick={() => setActiveTab(tab.id as 'basic' | 'tree' | 'members')}
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