import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Globe, Lock, MoreHorizontal } from 'lucide-react';

interface Group {
  id: string;
  name: string;
  description: string;
  avatar: string;
  coverImage?: string;
  memberCount: number;
  lastActivity: string;
  privacy: 'public' | 'private';
  isJoined: boolean;
  category: string;
}

const GroupPostPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  // Mock groups data
  const [groups, setGroups] = useState<Group[]>([
    {
      id: '1',
      name: 'Gia phả bố',
      description: 'Lần truy cập gần đây nhất: 1 tuần trước',
      avatar: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=100&h=100&fit=crop',
      coverImage: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=300&h=150&fit=crop',
      memberCount: 15432,
      lastActivity: '1 tuần trước',
      privacy: 'public',
      isJoined: true,
      category: 'Automotive'
    },
    {
      id: '2',
      name: 'Gia phả mẹ',
      description: 'Lần truy cập gần đây nhất: 31 phút trước',
      avatar: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=100&h=100&fit=crop',
      coverImage: 'https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=300&h=150&fit=crop',
      memberCount: 89234,
      lastActivity: '31 phút trước',
      privacy: 'public',
      isJoined: true,
      category: 'Education'
    },
    {
      id: '3',
      name: 'Gia phả vợ/chồng',
      description: 'Lần truy cập gần đây nhất: 21 tuần trước',
      avatar: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=100&h=100&fit=crop',
      coverImage: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=300&h=150&fit=crop',
      memberCount: 45678,
      lastActivity: '21 tuần trước',
      privacy: 'public',
      isJoined: true,
      category: 'Technology'
    }
  ]);

  const managedGroups = groups.filter(group => group.isJoined).slice(0, 6);
  const joinedGroups = groups.filter(group => group.isJoined);

  const filteredGroups = groups.filter(group => {
    const matchesSearch = group.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });


  const handleJoinGroup = (groupId: string) => {
    setGroups(prev => prev.map(group => 
      group.id === groupId ? { ...group, isJoined: !group.isJoined } : group
    ));
  };

  const handleViewGroup = (groupId: string) => {
    navigate(`/group/${groupId}`);
  };

  const formatMemberCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K`;
    }
    return count.toString();
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Sidebar and Main Content */}
        <div className="flex gap-6">
          {/* Left Sidebar */}
          <div className="w-80 space-y-4">
            {/* Header */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-2xl font-bold text-gray-900">Nhóm gia phả</h1>
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

            {/* Managed Groups */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Gia phả do bạn quản lý</h3>
                </div>
                
                <div className="space-y-3">
                  {managedGroups.map((group) => (
                    <div key={group.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <img
                        src={group.avatar}
                        alt={group.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{group.name}</p>
                        <p className="text-xs text-gray-500">Lần hoạt động gần nhất: {group.lastActivity}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Joined Groups */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900">Gia phả bạn đã tham gia</h3>
                </div>
                
                <div className="space-y-3">
                  {joinedGroups.slice(0, 8).map((group) => (
                    <div key={group.id} className="flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer">
                      <img
                        src={group.avatar}
                        alt={group.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{group.name}</p>
                        <p className="text-xs text-gray-500">{formatMemberCount(group.memberCount)} thành viên</p>
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
                    Tất cả gia phả bạn đã tham gia ({joinedGroups.length})
                  </h2>
                  <p className="text-gray-600">Khám phá tin tức gia phả</p>
                </div>
              </div>
            </div>

            {/* Groups Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredGroups.map((group) => (
                <div key={group.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* Cover Image */}
                  {group.coverImage && (
                    <div className="relative h-32 bg-gray-200">
                      <img
                        src={group.coverImage}
                        alt={group.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2">
                        <button className="p-1 bg-white/80 hover:bg-white rounded-full">
                          <MoreHorizontal className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Group Info */}
                  <div className="p-4">
                    <div className="flex items-start space-x-3 mb-3">
                      <img
                        src={group.avatar}
                        alt={group.name}
                        className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 mb-1 line-clamp-2">{group.name}</h3>
                        <p className="text-sm text-gray-600 mb-2">{group.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <div className="flex items-center space-x-1">
                            {group.privacy === 'public' ? (
                              <Globe className="w-3 h-3" />
                            ) : (
                              <Lock className="w-3 h-3" />
                            )}
                            <span>{formatMemberCount(group.memberCount)} thành viên</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Button */}
                    <button
                      onClick={() => handleViewGroup(group.id)}
                      className="w-full py-2 px-4 rounded-lg font-medium transition-colors bg-blue-600 text-white hover:bg-blue-700"
                    >Xem nhóm
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GroupPostPage;
