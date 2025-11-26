import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, Calendar, Sparkles, TrendingUp, Crown } from 'lucide-react';
import familyTreeService from '@/services/familyTreeService';
import type { Familytree } from '@/types/familytree';

const GroupPostPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [familyTrees, setFamilyTrees] = useState<Familytree[]>([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
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

  const getCardGradient = (index: number) => {
    const gradients = [
      'from-violet-500 via-purple-500 to-fuchsia-500',
      'from-cyan-500 via-blue-500 to-indigo-500',
      'from-emerald-500 via-teal-500 to-cyan-500',
      'from-rose-500 via-pink-500 to-purple-500',
      'from-amber-500 via-orange-500 to-red-500',
      'from-lime-500 via-green-500 to-emerald-500',
    ];
    return gradients[index % gradients.length];
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
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30 relative">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300/20 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-40 w-80 h-80 bg-pink-300/20 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <div className="relative mx-auto px-6 py-8 max-w-[1800px]">
        {/* Error Display */}
        {error && (
          <div className="bg-rose-50/90 backdrop-blur-sm border border-rose-200 rounded-2xl p-5 mb-6 shadow-lg">
            <p className="text-rose-800 font-medium">⚠️ Lỗi: {error}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-3 px-5 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-xl hover:from-rose-600 hover:to-rose-700 font-medium shadow-md hover:shadow-lg transition-all transform hover:scale-105"
            >
              Thử lại
            </button>
          </div>
        )}

        <div className="flex gap-6">
          {/* Left Sidebar */}
          <div className="w-80 space-y-5 flex-shrink-0">
            {/* Header Card */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-6 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-5">
                <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                  Gia tộc
                </h1>
              </div>

              {/* Search */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-violet-500 transition-colors" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm gia tộc..."
                  className="w-full pl-12 pr-4 py-3.5 bg-gradient-to-r from-gray-50 to-gray-100/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-violet-400 focus:bg-white border border-gray-200/50 transition-all shadow-inner"
                />
              </div>
            </div>

            {/* All Family Trees */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 hover:shadow-2xl transition-all duration-300">
              <div className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-bold text-lg bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-violet-500" />
                    Tất cả gia tộc
                  </h3>
                  <span className="px-3 py-1 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold rounded-full shadow-md">
                    {familyTrees.length}
                  </span>
                </div>

                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {familyTrees.slice(0, 12).map((familyTree, idx) => (
                    <div
                      key={familyTree.id}
                      className="group flex items-center space-x-3 p-3 hover:bg-gradient-to-r hover:from-violet-50 hover:to-purple-50 rounded-xl cursor-pointer transition-all duration-300 border border-transparent hover:border-violet-200 hover:shadow-md transform hover:scale-[1.02]"
                      onClick={() => handleViewGroup(familyTree.id)}
                    >
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${getCardGradient(idx)} flex items-center justify-center text-white text-base font-bold shadow-lg group-hover:shadow-xl transform group-hover:scale-110 transition-all duration-300`}>
                        {familyTree.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-800 truncate group-hover:text-violet-600 transition-colors">{familyTree.name}</p>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                          <Users className="w-3 h-3" />
                          <span className="font-medium">{formatMemberCount(familyTree.memberCount)} thành viên</span>
                        </div>
                      </div>
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-8 mb-6 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg">
                  <Crown className="w-7 h-7 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Tất cả gia tộc
                  </h2>
                  <p className="text-gray-600 font-medium mt-1">Khám phá và quản lý {familyTrees.length} gia tộc của bạn</p>
                </div>
              </div>
            </div>

            {/* Family Trees Grid */}
            {filteredFamilyTrees.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/60 p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-gray-500 text-lg font-medium">
                  {searchQuery ? '🔍 Không tìm thấy gia tộc nào phù hợp với từ khóa tìm kiếm.' : '📋 Chưa có gia tộc nào.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredFamilyTrees.map((familyTree, idx) => (
                  <div
                    key={familyTree.id}
                    className="group bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-500 border border-white/60 transform hover:scale-[1.03] hover:-translate-y-1"
                    onMouseEnter={() => setHoveredCard(familyTree.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                  >
                    {/* Cover */}
                    <div className={`relative h-40 bg-gradient-to-br ${getCardGradient(idx)} overflow-hidden`}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent"></div>
                      <div className={`absolute inset-0 bg-white/20 backdrop-blur-sm transition-opacity duration-500 ${hoveredCard === familyTree.id ? 'opacity-100' : 'opacity-0'}`}></div>

                      {/* Floating Badge */}
                      <div className="absolute top-4 right-4">
                        <div className="px-3 py-1.5 bg-white/95 backdrop-blur-sm rounded-full text-xs font-bold text-gray-700 shadow-lg flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {formatMemberCount(familyTree.memberCount)}
                        </div>
                      </div>

                      {/* Avatar */}
                      <div className="absolute bottom-4 left-6">
                        <div className={`w-16 h-16 rounded-2xl bg-white/95 backdrop-blur-sm flex items-center justify-center text-2xl font-bold shadow-2xl transform transition-all duration-300 ${hoveredCard === familyTree.id ? 'scale-110 rotate-3' : ''}`}>
                          <span className={`bg-gradient-to-br ${getCardGradient(idx)} bg-clip-text text-transparent`}>
                            {familyTree.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="p-6">
                      <div className="mb-4">
                        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-violet-600 transition-colors">
                          {familyTree.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                          {familyTree.description}
                        </p>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                            <span className="font-medium">Chủ: {familyTree.owner}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <Calendar className="w-3.5 h-3.5 text-blue-500" />
                            <span className="font-medium">Tạo: {formatDate(familyTree.createdAt)}</span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleViewGroup(familyTree.id)}
                        className={`w-full py-3 px-4 rounded-xl font-bold transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 bg-gradient-to-r ${getCardGradient(idx)} text-white relative overflow-hidden group`}
                      >
                        <span className="relative z-10 flex items-center justify-center gap-2">
                          <Sparkles className="w-4 h-4" />
                          Xem gia tộc
                        </span>
                        <div className="absolute inset-0 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left"></div>
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
                  className="px-5 py-2.5 bg-white/80 backdrop-blur-xl border border-white/60 rounded-xl text-sm font-bold text-gray-700 hover:bg-violet-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:transform-none"
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
                        className={`w-11 h-11 rounded-xl text-sm font-bold transition-all shadow-lg transform hover:scale-110 ${page === pagination.pageIndex
                          ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-xl scale-110'
                          : 'bg-white/80 backdrop-blur-xl border border-white/60 text-gray-700 hover:bg-violet-50'
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
                  className="px-5 py-2.5 bg-white/80 backdrop-blur-xl border border-white/60 rounded-xl text-sm font-bold text-gray-700 hover:bg-violet-50 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition-all transform hover:scale-105 disabled:transform-none"
                >
                  Trang sau →
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Styles */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 20px) scale(0.9); }
          75% { transform: translate(50px, 50px) scale(1.05); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #8b5cf6, #7c3aed);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #7c3aed, #6d28d9);
        }
      `}} />
    </div>
  );
};

export default GroupPostPage;
