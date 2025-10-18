import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Globe, MoreHorizontal } from 'lucide-react';
import familyTreeService, { type FamilyTree } from '@/services/familyTreeService';

interface ApiResponse {
  statusCode: number;
  message: string;
  status: boolean;
  data: FamilyTree[];
  errors: null;
  hasError: boolean;
}

const GroupPostPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [familyTrees, setFamilyTrees] = useState<FamilyTree[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load family trees data
  useEffect(() => {
    const loadFamilyTrees = async () => {
      setInitialLoading(true);
      setError(null);
      try {
        const result = await familyTreeService.getAllFamilyTrees();
        
        if (result.status && result.data) {
          setFamilyTrees(result.data.filter(ft => ft.isActive));
        } else {
          throw new Error(result.message || 'Không thể tải dữ liệu gia phả');
        }
      } catch (error) {
        console.error('Error loading family trees:', error);
        setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải dữ liệu');
      } finally {
        setInitialLoading(false);
      }
    };

    loadFamilyTrees();
  }, []);

  // Filtered family trees based on search query
  const filteredFamilyTrees = familyTrees.filter(familyTree =>
    familyTree.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleViewGroup = (familyTreeId: string) => {
    navigate(`/group/${familyTreeId}`);
  };

  const formatMemberCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
    const diffInWeeks = Math.floor(diffInDays / 7);
    
    if (diffInDays === 0) {
      return 'Hôm nay';
    } else if (diffInDays < 7) {
      return `${diffInDays} ngày trước`;
    } else if (diffInWeeks < 4) {
      return `${diffInWeeks} tuần trước`;
    } else {
      return date.toLocaleDateString('vi-VN');
    }
  };

  // Skeleton Loading Component
  const FamilyTreeSkeleton = () => (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Left Sidebar Skeleton */}
          <div className="w-80 space-y-4">
            {/* Header Skeleton */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="h-8 bg-gray-200 rounded-lg mb-4 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded-full animate-pulse"></div>
            </div>
            
            {/* Recent Family Trees Skeleton */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="h-6 bg-gray-200 rounded-lg mb-4 animate-pulse"></div>
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-2">
                    <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Skeleton */}
          <div className="flex-1">
            {/* Header Skeleton */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="h-8 bg-gray-200 rounded-lg mb-2 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>

            {/* Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="h-32 bg-gray-200 animate-pulse"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    <div className="h-10 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  if (initialLoading) {
    return <FamilyTreeSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">Lỗi: {error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <div className="w-80 space-y-4">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900">Gia phả</h1>
              </div>
              
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm gia phả"
                  className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Recent Family Trees */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Gia phả gần đây</h3>
                </div>
                
                <div className="space-y-3">
                  {familyTrees.slice(0, 6).map((familyTree) => (
                    <div 
                      key={familyTree.id} 
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                      onClick={() => handleViewGroup(familyTree.id)}
                    >
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold">
                        {familyTree.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{familyTree.name}</p>
                        <p className="text-xs text-gray-500">Cập nhật: {formatDate(familyTree.lastModifiedAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* All Family Trees */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Tất cả gia phả</h3>
                </div>
                
                <div className="space-y-3">
                  {familyTrees.slice(0, 8).map((familyTree) => (
                    <div 
                      key={familyTree.id} 
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer"
                      onClick={() => handleViewGroup(familyTree.id)}
                    >
                      <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-sm font-semibold">
                        {familyTree.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{familyTree.name}</p>
                        <p className="text-xs text-gray-500">{formatMemberCount(familyTree.memberCount)} thành viên</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Tất cả gia phả ({familyTrees.length})
                  </h2>
                  <p className="text-gray-600">Khám phá và quản lý các gia phả của bạn</p>
                </div>
              </div>
            </div>

            {/* Family Trees Grid */}
            {filteredFamilyTrees.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-8 text-center">
                <p className="text-gray-500 text-lg">
                  {searchQuery ? 'Không tìm thấy gia phả nào phù hợp với từ khóa tìm kiếm.' : 'Chưa có gia phả nào.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredFamilyTrees.map((familyTree) => (
                  <div key={familyTree.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    {/* Cover/Header */}
                    <div className="relative h-32 bg-gradient-to-r from-blue-500 to-purple-600">
                      <div className="absolute top-2 right-2">
                        <button className="p-1 bg-white/80 hover:bg-white rounded-full">
                          <MoreHorizontal className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                      <div className="absolute bottom-4 left-4">
                        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-blue-600 text-xl font-bold shadow-lg">
                          {familyTree.name.charAt(0).toUpperCase()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Family Tree Info */}
                    <div className="p-4">
                      <div className="mb-3">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{familyTree.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{familyTree.description}</p>
                        <p className="text-xs text-gray-500 mb-2">Chủ sở hữu: {familyTree.owner}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            <Globe className="w-3 h-3" />
                            <span>{formatMemberCount(familyTree.memberCount)} thành viên</span>
                          </div>
                          <span>Tạo: {formatDate(familyTree.createdAt)}</span>
                        </div>
                      </div>
                      
                      {/* Action Button */}
                      <button
                        onClick={() => handleViewGroup(familyTree.id)}
                        className="w-full py-2 px-4 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
                      >
                        Xem gia phả
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupPostPage;
