import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { User, FileText, Briefcase } from 'lucide-react';
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

    const tabs = [
        { id: 'personal', label: 'THÔNG TIN CƠ BẢN', icon: User },
        { id: 'biography', label: 'TIỂU SỬ', icon: FileText },
        { id: 'occupation', label: 'CÔNG VIỆC/HỌC VẤN', icon: Briefcase },
    ];

    return (
        <div className="h-full w-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 overflow-y-auto">
            <div className="max-w mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                            <User className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                TÀI KHOẢN CỦA TÔI
                            </h1>
                            <p className="text-gray-600 mt-1.5">
                                Quản lý thông tin cá nhân và tài khoản của bạn
                            </p>
                        </div>
                    </div>
                </div>

                {/* Navigation Tabs */}
                <div className="bg-white rounded-xl shadow-md border border-gray-200 mb-8">
                    <div className="flex border-b border-gray-200">
                        {tabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => handleTabChange(tab.id)}
                                    className={`flex-1 py-4 px-6 font-semibold text-sm transition-colors border-b-2 flex items-center justify-center gap-2 ${
                                        isActive
                                            ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                                    }`}
                                >
                                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400'}`} />
                                    <span>{tab.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Tab Content */}
                <div>
                        {activeTab === 'personal' && <DetailInformation />}
                        {activeTab === 'biography' && <Biography />}
                        {activeTab === 'occupation' && <Occupation />}
                </div>
            </div>
        </div>
    );
};

export default MyAccountPage;