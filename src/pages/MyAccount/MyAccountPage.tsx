import React, { useState } from 'react';
import DetailInformation from './DetailInformation';
import FamilyTree from './FamilyTree';
import RecentActivities from './RecentActivities';

const MyAccountPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('personal');

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
    };

    return (
        <div className="h-full bg-gray-50">
            <div className="h-full px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        TÀI KHOẢN CỦA TÔI
                    </h1>
                </div>

                {/* Navigation Tabs */}
                <div className="border-b border-gray-200 mb-8">
                    <nav className="flex space-x-12">
                        <button
                            onClick={() => handleTabChange('personal')}
                            className={`py-3 px-1 border-b-2 font-semibold text-base transition-colors ${activeTab === 'personal'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            THÔNG TIN CƠ BẢN
                        </button>
                        <button
                            onClick={() => handleTabChange('family')}
                            className={`py-3 px-1 border-b-2 font-semibold text-base transition-colors ${activeTab === 'family'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            GIA PHẢ
                        </button>
                        <button
                            onClick={() => handleTabChange('activities')}
                            className={`py-3 px-1 border-b-2 font-semibold text-base transition-colors ${activeTab === 'activities'
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            HOẠT ĐỘNG GẦN ĐÂY
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'personal' && <DetailInformation />}
                {activeTab === 'family' && <FamilyTree />}
                {activeTab === 'activities' && <RecentActivities />}
            </div>
        </div>
    );
};

export default MyAccountPage;