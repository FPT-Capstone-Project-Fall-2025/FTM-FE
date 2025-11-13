import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Users, LayoutGrid, Newspaper, Clock, ChevronRight, Home as HomeIcon, Loader2 } from 'lucide-react';
import moment from 'moment';
import 'moment/locale/vi';
import eventService from '@/services/eventService';
import familyTreeService from '@/services/familyTreeService';
import postService from '@/services/postService';
import { useAppSelector } from '@/hooks/redux';
import { toast } from 'react-toastify';

moment.locale('vi');

interface UpcomingEvent {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  eventType: string;
  imageUrl?: string;
  location?: string;
  ftId?: string;
}

interface RecentPost {
  id: string;
  title: string;
  content: string;
  authorName: string;
  authorPicture: string;
  createdOn: string;
  totalComments: number;
  totalReactions: number;
  attachments?: Array<{ url: string; type: string }>;
  gpId?: string;
}

interface FamilyTreeSummary {
  id: string;
  name: string;
  owner: string;
  memberCount: number;
  filePath?: string;
}

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { token } = useAppSelector(state => state.auth);
  
  const [loading, setLoading] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState<UpcomingEvent[]>([]);
  const [recentPosts, setRecentPosts] = useState<RecentPost[]>([]);
  const [familyTrees, setFamilyTrees] = useState<FamilyTreeSummary[]>([]);
  const [stats, setStats] = useState({
    totalFamilyTrees: 0,
    totalMembers: 0,
    upcomingEventsCount: 0,
    recentPostsCount: 0,
  });

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    fetchHomeData();
  }, [token]);

  const fetchHomeData = async () => {
    try {
      setLoading(true);
      
      // Fetch family trees
      const treesResponse = await familyTreeService.getMyFamilytrees();
      const trees = treesResponse?.data?.data || [];
      setFamilyTrees(trees.slice(0, 4)); // Limit to 4 for display
      
      // Calculate total members
      const totalMembers = trees.reduce((sum: number, tree: any) => sum + (tree.memberCount || 0), 0);
      
      // Fetch upcoming events from all family trees
      const now = moment();
      
      const allEvents: UpcomingEvent[] = [];
      
      for (const tree of trees.slice(0, 5)) { // Limit to 5 trees to avoid too many API calls
        try {
          const response = await eventService.getUpcomingEventsByFtId(tree.id, 30);
          const events = (response?.data as any)?.data || response?.data || [];
          
          // Filter events that are in the future
          const upcomingEventsFromTree = events
            .filter((event: any) => event && event.startTime && moment(event.startTime).isAfter(now))
            .map((event: any) => ({
              id: event.id || '',
              name: event.name || 'Sự kiện',
              startTime: event.startTime || new Date().toISOString(),
              endTime: event.endTime || event.startTime || new Date().toISOString(),
              eventType: event.eventType || 'OTHER',
              imageUrl: event.imageUrl,
              location: event.location || event.locationName || '',
              ftId: tree.id,
            }));
          
          allEvents.push(...upcomingEventsFromTree);
        } catch (error) {
          console.error(`Error fetching events for tree ${tree.id}:`, error);
        }
      }
      
      // Sort by startTime and limit to 8
      const sortedEvents = allEvents
        .filter((event) => event && event.startTime)
        .sort((a, b) => moment(a.startTime).diff(moment(b.startTime)))
        .slice(0, 8);
      
      setUpcomingEvents(sortedEvents);
      
      // Fetch recent posts from all family trees
      const allPosts: RecentPost[] = [];
      
      for (const tree of trees.slice(0, 5)) { // Limit to 5 trees
        try {
          const response = await postService.getPostsByFamilyTree(tree.id);
          const posts = (response?.data as any)?.data || response?.data || [];
          
          const mappedPosts = posts
            .filter((post: any) => post && post.id && post.createdOn)
            .map((post: any) => ({
              id: post.id || '',
              title: post.title || '',
              content: post.content || '',
              authorName: post.authorName || 'Người dùng',
              authorPicture: post.authorPicture || '',
              createdOn: post.createdOn || post.createdAt || new Date().toISOString(),
              totalComments: post.totalComments || 0,
              totalReactions: post.totalReactions || 0,
              attachments: (post.attachments || []).filter((att: any) => att && att.type && att.url),
              gpId: tree.id,
            }));
          
          allPosts.push(...mappedPosts);
        } catch (error) {
          console.error(`Error fetching posts for tree ${tree.id}:`, error);
        }
      }
      
      // Sort by createdOn (newest first) and limit to 8
      const sortedPosts = allPosts
        .filter((post) => post && post.createdOn)
        .sort((a, b) => moment(b.createdOn).diff(moment(a.createdOn)))
        .slice(0, 8);
      
      setRecentPosts(sortedPosts);
      
      // Update stats
      setStats({
        totalFamilyTrees: trees.length,
        totalMembers,
        upcomingEventsCount: sortedEvents.length,
        recentPostsCount: sortedPosts.length,
      });
      
    } catch (error) {
      console.error('Error fetching home data:', error);
      toast.error('Không thể tải dữ liệu trang chủ');
    } finally {
      setLoading(false);
    }
  };

  const formatEventDate = (date: string) => {
    if (!date) return 'Chưa có thời gian';
    try {
      return moment(date).locale('vi').format('DD/MM/YYYY HH:mm');
    } catch (error) {
      return 'Chưa có thời gian';
    }
  };

  const getEventTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      'WEDDING': 'Cưới hỏi',
      'BIRTHDAY': 'Sinh nhật - Mừng thọ',
      'FUNERAL': 'Tang lễ',
      'HOLIDAY': 'Ngày lễ',
      'OTHER': 'Khác',
    };
    return typeMap[type?.toUpperCase()] || 'Sự kiện';
  };

  const getEventTypeColor = (type: string) => {
    const normalizedType = type?.toUpperCase();
    switch (normalizedType) {
      case 'WEDDING':
        return 'bg-pink-100 text-pink-800';
      case 'BIRTHDAY':
        return 'bg-yellow-100 text-yellow-800';
      case 'FUNERAL':
        return 'bg-gray-100 text-gray-800';
      case 'HOLIDAY':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="h-full w-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 overflow-y-auto flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 overflow-y-auto">
      <div className="mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <HomeIcon className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                TRANG CHỦ
              </h1>
              <p className="text-gray-600 mt-1.5">
                Tổng quan về gia phả và hoạt động của bạn
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Gia phả</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalFamilyTrees}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl">
                <LayoutGrid className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <Link 
              to="/family-trees" 
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Thành viên</p>
                <p className="text-3xl font-bold text-gray-900">{stats.totalMembers}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
                <Users className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Sự kiện sắp tới</p>
                <p className="text-3xl font-bold text-gray-900">{stats.upcomingEventsCount}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-orange-100 to-amber-100 rounded-xl">
                <Calendar className="w-6 h-6 text-orange-600" />
              </div>
            </div>
            <Link 
              to="/events" 
              className="mt-4 text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
            >
              Xem tất cả <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">Bài viết mới</p>
                <p className="text-3xl font-bold text-gray-900">{stats.recentPostsCount}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl">
                <Newspaper className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>
   {/* Family Trees Summary */}
   {familyTrees.length > 0 && (
          <div className="mb-8">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <LayoutGrid className="w-5 h-5 text-green-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Gia phả của tôi</h2>
                </div>
                <Link
                  to="/family-trees"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  Xem tất cả <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {familyTrees.map((tree) => (
                  <div
                    key={tree.id}
                    onClick={() => navigate(`/family-trees/${tree.id}`)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                  >
                    <div className="h-32 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center mb-3 overflow-hidden">
                      {tree.filePath ? (
                        <img
                          src={tree.filePath}
                          alt={tree.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const fallback = e.currentTarget.parentElement?.querySelector('.tree-fallback');
                            if (fallback) {
                              (fallback as HTMLElement).style.display = 'flex';
                            }
                          }}
                        />
                      ) : null}
                      <div className="tree-fallback hidden w-full h-full items-center justify-center">
                        <LayoutGrid className="w-12 h-12 text-blue-400" />
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                      {tree.name}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span>{tree.memberCount} thành viên</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Upcoming Events */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-blue-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Sự kiện sắp tới</h2>
                </div>
                <Link
                  to="/events"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  Xem tất cả <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {upcomingEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Calendar className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm">Không có sự kiện sắp tới</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcomingEvents.map((event) => (
                    <div
                      key={event.id}
                      onClick={() => navigate(`/events`)}
                      className="p-4 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                    >
                      <div className="flex items-start gap-4">
                        {event.imageUrl ? (
                          <img
                            src={event.imageUrl}
                            alt={event.name}
                            className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Calendar className="w-8 h-8 text-blue-500" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                              {event.name}
                            </h3>
                            <span className={`px-2 py-1 text-xs font-medium rounded ${getEventTypeColor(event.eventType)} whitespace-nowrap flex-shrink-0`}>
                              {getEventTypeLabel(event.eventType)}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1.5">
                              <Clock className="w-4 h-4 text-gray-400" />
                              <span>{formatEventDate(event.startTime)}</span>
                            </div>
                            {event.location && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-gray-400">•</span>
                                <span className="line-clamp-1">{event.location}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recent Posts */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-md border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Newspaper className="w-5 h-5 text-purple-600" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">Bài viết mới</h2>
                </div>
                <Link
                  to="/group"
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                >
                  Xem tất cả <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              {recentPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Newspaper className="w-12 h-12 text-gray-300 mb-3" />
                  <p className="text-gray-500 text-sm">Chưa có bài viết nào</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentPosts.slice(0, 3).map((post) => (
                    <div
                      key={post.id}
                      onClick={() => post.gpId && navigate(`/group/${post.gpId}`)}
                      className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer group"
                    >
                      {post.title ? (
                        <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          {post.title}
                        </h4>
                      ) : (
                        <h4 className="font-semibold text-sm text-gray-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                          Bài viết không có tiêu đề
                        </h4>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

     
      </div>
    </div>
  );
};

export default HomePage;
