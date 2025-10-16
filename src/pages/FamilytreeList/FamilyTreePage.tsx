import { useState } from "react";
import BasicInfo from "./components/BasicInfo";
import Members from "./components/Members";
import FamilyTreeApp from "./components/FamilyTree/FamilyTree";

const FamilyTreePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'basic' | 'tree' | 'members'>('basic');

  const tabs = [
    { id: 'basic', label: 'THÔNG TIN CƠ BẢN' },
    { id: 'tree', label: 'GIA PHẢ' },
    { id: 'members', label: 'THÀNH VIÊN' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'basic':
        return <BasicInfo />;
      case 'tree':
        return <FamilyTreeApp />;
      case 'members':
        return <Members />;
      default:
        return null;
    }
  };

  return (
    <div className="h-full bg-gray-50">
      <div className="h-full px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        {/* Breadcrumb - Placeholder */}
        <div className="shrink-0 flex items-center gap-2 mb-6">
          <span className="text-sm text-gray-600">Trang chủ</span>
          <span className="text-gray-400">/</span>
          <span className="text-sm text-gray-600">Quản lý gia phả</span>
        </div>

        {/* Navigation Tabs */}
        <div className="shrink-0 border-b border-gray-200 mb-8">
          <nav className="flex space-x-8 sm:space-x-12">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as 'basic' | 'tree' | 'members')}
                className={`py-3 px-1 border-b-2 font-semibold text-sm sm:text-base transition-colors whitespace-nowrap ${
                  activeTab === tab.id
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
        <div className="grow overflow-hidden">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default FamilyTreePage;