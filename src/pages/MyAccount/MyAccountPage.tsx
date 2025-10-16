import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import DetailInformation from './DetailInformation';
import Biography from './Biography';
import Occupation from './Occupation';

const MyAccountPage: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();

    // Get tab from URL params or default to 'personal'
    const getInitialTab = () => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab');
        const validTabs = ['personal', 'biography', 'occupation', 'family'];
        return validTabs.includes(tab || '') ? tab : 'personal';
    };

    const [activeTab, setActiveTab] = useState(getInitialTab());

    // Update URL when tab changes
    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        navigate(`?tab=${tab}`, { replace: true });
    };

    // Sync state with URL on back/forward navigation
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tab = params.get('tab') || 'personal';
        setActiveTab(tab);
    }, [location.search]);

    return (
        <div className="h-full w-full bg-gray-50">
            <div className="h-full flex flex-col px-4 sm:px-6 lg:px-8 py-8">
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
                            onClick={() => handleTabChange('biography')}
                            className={`py-3 px-1 border-b-2 font-semibold text-base transition-colors ${activeTab === 'biography'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            TIỂU SỬ
                        </button>
                        <button
                            onClick={() => handleTabChange('occupation')}
                            className={`py-3 px-1 border-b-2 font-semibold text-base transition-colors ${activeTab === 'occupation'
                                ? 'border-blue-600 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                        >
                            CÔNG VIỆC/HỌC VẤN
                        </button>
                    </nav>
                </div>

                {/* Tab Content */}
                {activeTab === 'personal' && <DetailInformation />}
                {activeTab === 'biography' && <Biography />}
                {activeTab === 'occupation' && <Occupation />}
            </div>
        </div>
    );
};

export default MyAccountPage;