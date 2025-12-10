import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, TrendingUp, Crown, Clock, ChevronRight } from 'lucide-react';
import familyTreeService from '@/services/familyTreeService';
import type { Familytree } from '@/types/familytree';

const GroupPostPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [familyTrees, setFamilyTrees] = useState<Familytree[]>([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    pageIndex: 1,
    pageSize: 10,
    totalPages: 0,
    totalItems: 0
  });

  // Load family trees data
  useEffect(() => {
    const loadFamilyTrees = async () => {
      setInitialLoading(true);
      setError(null);
      try {
        const result = await familyTreeService.getAllFamilyTrees(pagination.pageIndex, pagination.pageSize);

        if (result.status && result.data) {
          const paginatedData = result.data;
          setFamilyTrees(paginatedData.data.filter(ft => ft.isActive));
          setPagination({
            pageIndex: paginatedData.pageIndex,
            pageSize: paginatedData.pageSize,
            totalPages: paginatedData.totalPages,
            totalItems: paginatedData.totalItems
          });
        } else {
          throw new Error(result.message || 'Không thể tải dữ liệu gia tộc');
        }
      } catch (error) {
        console.error('Error loading family trees:', error);
        setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi tải dữ liệu');
      } finally {
        setInitialLoading(false);
      }
    };

    loadFamilyTrees();
  }, [pagination.pageIndex, pagination.pageSize]);

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

  const FamilyTreeSkeleton = () => (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
      <div className="max-w-[1800px] mx-auto px-6 py-8">
        <div className="flex gap-6">
          <div className="w-80 space-y-5">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6">
              <div className="h-10 bg-gray-200 rounded-xl mb-5 animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded-2xl animate-pulse"></div>
            </div>
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-6">
              <div className="h-6 bg-gray-200 rounded-lg mb-4 animate-pulse"></div>
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-3">
                    <div className="w-11 h-11 bg-gray-200 rounded-xl animate-pulse"></div>
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1">
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl p-8 mb-6">
              <div className="h-10 bg-gray-200 rounded-lg mb-2 animate-pulse"></div>
              <div className="h-5 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden">
                  <div className="h-40 bg-gray-200 animate-pulse"></div>
                  <div className="p-6 space-y-3">
                    <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 animate-pulse"></div>
                    <div className="h-12 bg-gray-200 rounded-xl animate-pulse"></div>
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Display */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 mb-6">
            <p className="text-rose-800 font-medium">⚠️ Lỗi: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-5 py-2.5 bg-rose-600 text-white rounded-xl hover:bg-rose-700 font-medium transition-colors"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Header Section */}
        <div className="mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-slate-900">Gia tộc</h1>
                    <p className="text-slate-600 text-sm mt-0.5">
                      Khám phá và kết nối với {familyTrees.length} dòng họ
                    </p>
                  </div>
                </div>
              </div>

              {/* Search Bar */}
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm theo tên gia tộc..."
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent transition-all text-slate-900 placeholder:text-slate-400"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Family Trees Grid */}
        {filteredFamilyTrees.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-16 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-slate-400" />
            </div>
            <p className="text-slate-600 text-lg">
              {searchQuery ? 'Không tìm thấy gia tộc phù hợp' : 'Chưa có gia tộc nào'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredFamilyTrees.map((familyTree) => (
              <div
                key={familyTree.id}
                className="group flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-slate-300 transition-all duration-300 overflow-hidden cursor-pointer"
                onClick={() => handleViewGroup(familyTree.id)}
              >
                {/* Card Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-14 h-14 bg-gradient-to-br from-slate-800 to-slate-700 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
                        <span className="text-white text-xl font-bold">
                          {familyTree.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-900 group-hover:text-slate-700 transition-colors">
                          {familyTree.name}
                        </h3>
                        <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-0.5">
                          <Users className="w-4 h-4" />
                          <span>{formatMemberCount(familyTree.memberCount)} thành viên</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <p className="text-slate-600 text-sm leading-relaxed line-clamp-3 mb-4">
                    {familyTree.description}
                  </p>

                  {/* Metadata */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Crown className="w-3.5 h-3.5 text-slate-400" />
                      <span>Chủ tộc: {familyTree.owner}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Tạo: {formatDate(familyTree.createdAt)}</span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="mt-auto border-t border-slate-100 p-6 bg-slate-50/50">
                  <button className="w-full flex items-center justify-between px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl transition-all group/btn">
                    <span className="font-medium text-sm">Xem chi tiết</span>
                    <ChevronRight className="w-5 h-5 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-3">
            <button
              onClick={() => setPagination(prev => ({ ...prev, pageIndex: Math.max(1, prev.pageIndex - 1) }))}
              disabled={pagination.pageIndex === 1}
              className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              ← Trang trước
            </button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                let page;
                if (pagination.totalPages <= 5) {
                  page = i + 1;
                } else if (pagination.pageIndex <= 3) {
                  page = i + 1;
                } else if (pagination.pageIndex >= pagination.totalPages - 2) {
                  page = pagination.totalPages - 4 + i;
                } else {
                  page = pagination.pageIndex - 2 + i;
                }

                return (
                  <button
                    key={page}
                    onClick={() => setPagination(prev => ({ ...prev, pageIndex: page }))}
                    className={`w-11 h-11 rounded-xl text-sm font-medium transition-all ${page === pagination.pageIndex
                      ? 'bg-slate-900 text-white'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                  >
                    {page}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => setPagination(prev => ({ ...prev, pageIndex: Math.min(prev.totalPages, prev.pageIndex + 1) }))}
              disabled={pagination.pageIndex === pagination.totalPages}
              className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              Trang sau →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupPostPage;
