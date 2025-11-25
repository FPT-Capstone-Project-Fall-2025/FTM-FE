import React, { useState, useEffect } from 'react';
import {
  Users,
  ShieldAlert,
  BarChart3,
  Search,
  Eye,
  Check,
  X,
  Ban,
  UserPlus,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Menu,
  ArrowLeft,
  ExternalLink,
  FileSpreadsheet,
  Download
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import logo from '@/assets/img/logo.svg';

// Mock Types
interface User {
  id: string;
  fullname: string;
  username: string;
  email: string;
  status: 'active' | 'inactive' | 'banned';
  role: 'admin' | 'moderator' | 'user';
  createdAt: string;
  lastLogin: string;
  avatar?: string;
}

interface Report {
  id: string;
  reportedObject: string;
  reportedBy: string;
  reportType: 'post' | 'comment' | 'user' | 'campaign';
  reason: string;
  description: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: string;
  relatedId?: string; // ID of the reported object (postId, userId, etc.)
  relatedUrl?: string; // URL to navigate to the reported object
}

interface SystemStats {
  users: {
    total: number;
    active: number;
    banned: number;
    newToday: number;
  };
  campaigns: {
    total: number;
    active: number;
    completed: number;
    upcoming: number;
  };
  fund: {
    totalRaised: number;
    totalWithdrawn: number;
    currentBalance: number;
  };
  reports: {
    total: number;
    pending: number;
    resolved: number;
    dismissed: number;
  };
  transactions: {
    income: number;
    expense: number;
  };
}

const STORAGE_KEY = 'adminSidebarCollapsed';

const AdminPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Get initial sidebar state from localStorage
  const getInitialSidebarState = (): boolean => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved === 'true';
    } catch (error) {
      console.error('Failed to read sidebar state from localStorage:', error);
      return false;
    }
  };

  const [activeTab, setActiveTab] = useState<'users' | 'reports' | 'statistics' | 'export'>('statistics');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(getInitialSidebarState());
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<string>('all');
  const [userStatusFilter, setUserStatusFilter] = useState<string>('all');
  const [reportStatusFilter, setReportStatusFilter] = useState<string>('all');
  const [reportTypeFilter, setReportTypeFilter] = useState<string>('all');
  const [showUserDetail, setShowUserDetail] = useState(false);
  const [showReportDetail, setShowReportDetail] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  // Save sidebar state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, isSidebarCollapsed.toString());
    } catch (error) {
      console.error('Failed to save sidebar state to localStorage:', error);
    }
  }, [isSidebarCollapsed]);

  // Mock Users
  const [users] = useState<User[]>([
    {
      id: '1',
      fullname: 'Nguyễn Văn A',
      username: 'nguyenvana',
      email: 'nguyenvana@example.com',
      status: 'active',
      role: 'admin',
      createdAt: '2023-01-15',
      lastLogin: '2024-01-20'
    },
    {
      id: '2',
      fullname: 'Trần Thị B',
      username: 'tranthib',
      email: 'tranthib@example.com',
      status: 'active',
      role: 'user',
      createdAt: '2023-03-20',
      lastLogin: '2024-01-19'
    },
    {
      id: '3',
      fullname: 'Lê Văn C',
      username: 'levanc',
      email: 'levanc@example.com',
      status: 'banned',
      role: 'user',
      createdAt: '2023-05-10',
      lastLogin: '2024-01-15'
    },
    {
      id: '4',
      fullname: 'Phạm Thị D',
      username: 'phamthid',
      email: 'phamthid@example.com',
      status: 'inactive',
      role: 'moderator',
      createdAt: '2023-07-25',
      lastLogin: '2024-01-10'
    },
    {
      id: '5',
      fullname: 'Hoàng Văn E',
      username: 'hoangvane',
      email: 'hoangvane@example.com',
      status: 'active',
      role: 'user',
      createdAt: '2023-09-30',
      lastLogin: '2024-01-18'
    },
    {
      id: '6',
      fullname: 'Đỗ Thị F',
      username: 'dothif',
      email: 'dothif@example.com',
      status: 'active',
      role: 'user',
      createdAt: '2024-01-20',
      lastLogin: '2024-01-20'
    }
  ]);

  // Mock Reports
  const [reports, setReports] = useState<Report[]>([
    {
      id: '1',
      reportedObject: 'Bài viết về hoạt động gia tộc',
      reportedBy: 'Nguyễn Văn A',
      reportType: 'post',
      reason: 'Nội dung không phù hợp',
      description: 'Bài viết chứa thông tin sai sự thật về lịch sử gia tộc',
      status: 'pending',
      createdAt: '2024-01-20',
      relatedId: 'post-123',
      relatedUrl: '/group/822994d5-7acd-41f8-b12b-e0a634d74440?postId=post-123'
    },
    {
      id: '2',
      reportedObject: 'Bình luận spam',
      reportedBy: 'Trần Thị B',
      reportType: 'comment',
      reason: 'Spam hoặc lặp lại',
      description: 'Người dùng spam nhiều bình luận không liên quan',
      status: 'pending',
      createdAt: '2024-01-19',
      relatedId: 'comment-456',
      relatedUrl: '/group/822994d5-7acd-41f8-b12b-e0a634d74440?postId=post-789'
    },
    {
      id: '3',
      reportedObject: 'Lê Văn C',
      reportedBy: 'Phạm Thị D',
      reportType: 'user',
      reason: 'Hành vi không phù hợp',
      description: 'Người dùng có hành vi khiêu khích và lăng mạ thành viên khác',
      status: 'resolved',
      createdAt: '2024-01-18',
      relatedId: 'user-3',
      relatedUrl: '/group/822994d5-7acd-41f8-b12b-e0a634d74440'
    },
    {
      id: '4',
      reportedObject: 'Chiến dịch gây quỹ giả',
      reportedBy: 'Hoàng Văn E',
      reportType: 'campaign',
      reason: 'Nghi ngờ lừa đảo',
      description: 'Chiến dịch có dấu hiệu lừa đảo, người tổ chức không xác thực',
      status: 'pending',
      createdAt: '2024-01-17',
      relatedId: 'campaign-1',
      relatedUrl: '/family-trees/tree-id?tab=fund'
    },
    {
      id: '5',
      reportedObject: 'Bài viết chứa thông tin cá nhân',
      reportedBy: 'Đỗ Thị F',
      reportType: 'post',
      reason: 'Vi phạm quyền riêng tư',
      description: 'Bài viết công khai thông tin cá nhân không được phép',
      status: 'dismissed',
      createdAt: '2024-01-15',
      relatedId: 'post-999',
      relatedUrl: '/group/822994d5-7acd-41f8-b12b-e0a634d74440?postId=post-999'
    }
  ]);

  // Mock System Stats
  const [systemStats] = useState<SystemStats>({
    users: {
      total: 1250,
      active: 1080,
      banned: 35,
      newToday: 12
    },
    campaigns: {
      total: 45,
      active: 15,
      completed: 25,
      upcoming: 5
    },
    fund: {
      totalRaised: 2500000000,
      totalWithdrawn: 1200000000,
      currentBalance: 1300000000
    },
    reports: {
      total: 156,
      pending: 25,
      resolved: 108,
      dismissed: 23
    },
    transactions: {
      income: 500000000,
      expense: 300000000
    }
  });

  // Format Currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Format Date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Filter Users
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.fullname.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email.toLowerCase().includes(userSearch.toLowerCase());
    const matchesRole = userRoleFilter === 'all' || user.role === userRoleFilter;
    const matchesStatus = userStatusFilter === 'all' || user.status === userStatusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // Filter Reports
  const filteredReports = reports.filter(report => {
    const matchesStatus = reportStatusFilter === 'all' || report.status === reportStatusFilter;
    const matchesType = reportTypeFilter === 'all' || report.reportType === reportTypeFilter;
    return matchesStatus && matchesType;
  });

  // Handle User Actions
  const handleUserStatusChange = (_userId: string, newStatus: 'active' | 'inactive' | 'banned') => {
    toast.success(`Đã thay đổi trạng thái người dùng thành ${newStatus === 'active' ? 'Hoạt động' : newStatus === 'inactive' ? 'Vô hiệu' : 'Bị cấm'}`);
  };

  // Handle Report Actions
  const handleReportAction = (reportId: string, action: 'resolve' | 'dismiss' | 'delete') => {
    setReports(reports.map(report => 
      report.id === reportId 
        ? { ...report, status: action === 'resolve' ? 'resolved' : action === 'dismiss' ? 'dismissed' : report.status }
        : report
    ));
    toast.success(`Đã ${action === 'resolve' ? 'xử lý vi phạm' : action === 'dismiss' ? 'bỏ qua' : 'xóa'} báo cáo`);
    setShowReportDetail(false);
    setSelectedReport(null);
  };

  // Export Functions
  const exportToCSV = (data: any[], headerKeys: string[], headers: string[], filename: string) => {
    // Create header row
    const headerRow = headers.join(',');
    
    // Create data rows
    const dataRows = data.map(row => {
      return headerKeys.map(key => {
        const value = row[key] || '';
        // Escape commas and quotes in CSV
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      }).join(',');
    });
    
    // Combine header and data
    const csvContent = [headerRow, ...dataRows].join('\n');
    
    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(`Đã xuất file ${filename}`);
  };

  const handleExportUsers = () => {
    const headerKeys = ['id', 'fullname', 'username', 'email', 'role', 'status', 'createdAt', 'lastLogin'];
    const headers = ['ID', 'Họ Tên', 'Username', 'Email', 'Vai Trò', 'Trạng Thái', 'Ngày Tạo', 'Lần Đăng Nhập Cuối'];
    const csvData = users.map(user => ({
      id: user.id,
      fullname: user.fullname,
      username: user.username,
      email: user.email,
      role: user.role === 'admin' ? 'Quản trị' : user.role === 'moderator' ? 'Điều hành' : 'Người dùng',
      status: user.status === 'active' ? 'Hoạt động' : user.status === 'inactive' ? 'Vô hiệu' : 'Bị cấm',
      createdAt: formatDate(user.createdAt),
      lastLogin: formatDate(user.lastLogin)
    }));
    exportToCSV(csvData, headerKeys, headers, `danh-sach-nguoi-dung-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportReports = () => {
    const headerKeys = ['id', 'object', 'reportedBy', 'type', 'reason', 'description', 'status', 'createdAt'];
    const headers = ['ID', 'Đối Tượng', 'Người Báo Cáo', 'Loại', 'Lý Do', 'Mô Tả', 'Trạng Thái', 'Ngày Tạo'];
    const csvData = reports.map(report => ({
      id: report.id,
      object: report.reportedObject,
      reportedBy: report.reportedBy,
      type: report.reportType === 'post' ? 'Bài viết' : 
            report.reportType === 'comment' ? 'Bình luận' : 
            report.reportType === 'user' ? 'Người dùng' : 'Chiến dịch',
      reason: report.reason,
      description: report.description,
      status: report.status === 'pending' ? 'Chờ xử lý' : 
              report.status === 'resolved' ? 'Đã xử lý vi phạm' : 'Đã bỏ qua',
      createdAt: formatDate(report.createdAt)
    }));
    exportToCSV(csvData, headerKeys, headers, `danh-sach-bao-cao-${new Date().toISOString().split('T')[0]}.csv`);
  };

  const handleExportStatistics = () => {
    const statisticsData = {
      'Thống kê': 'Giá trị',
      'Tổng người dùng': systemStats.users.total,
      'Người dùng hoạt động': systemStats.users.active,
      'Người dùng bị cấm': systemStats.users.banned,
      'Người dùng mới hôm nay': systemStats.users.newToday,
      'Tổng chiến dịch': systemStats.campaigns.total,
      'Chiến dịch đang hoạt động': systemStats.campaigns.active,
      'Chiến dịch hoàn thành': systemStats.campaigns.completed,
      'Chiến dịch sắp diễn ra': systemStats.campaigns.upcoming,
      'Tổng số dư quỹ': formatCurrency(systemStats.fund.currentBalance),
      'Tổng đã gây quỹ': formatCurrency(systemStats.fund.totalRaised),
      'Tổng đã rút': formatCurrency(systemStats.fund.totalWithdrawn),
      'Tổng báo cáo': systemStats.reports.total,
      'Báo cáo chờ xử lý': systemStats.reports.pending,
      'Báo cáo đã giải quyết': systemStats.reports.resolved,
      'Báo cáo đã bỏ qua': systemStats.reports.dismissed,
      'Tổng thu nhập': formatCurrency(systemStats.transactions.income),
      'Tổng chi tiêu': formatCurrency(systemStats.transactions.expense)
    };
    
    const csvContent = Object.entries(statisticsData).map(([key, value]) => `${key},${value}`).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = `thong-ke-he-thong-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success('Đã xuất thống kê hệ thống');
  };

  const handleExportAll = () => {
    toast.info('Đang xuất tất cả dữ liệu...');
    setTimeout(() => {
      handleExportUsers();
      setTimeout(() => handleExportReports(), 500);
      setTimeout(() => handleExportStatistics(), 1000);
      toast.success('Đã xuất tất cả báo cáo');
    }, 500);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-md">
        <div className="mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Left side */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                className="p-2 rounded-md hover:bg-blue-700"
                title={isSidebarCollapsed ? 'Mở rộng' : 'Thu gọn'}
              >
                <Menu size={24} />
              </button>
              <div className="flex items-center space-x-2 ml-4">
                <img src={logo} alt="Logo" className="h-8 w-8" />
                <span className="text-lg font-semibold">QUẢN TRỊ HỆ THỐNG</span>
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/home')}
                className="flex items-center space-x-2 px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                title="Trở về trang người dùng"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Trở về</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 overflow-hidden flex relative">
        {/* Left Sidebar Navigation */}
        <div className={`bg-white border-r border-gray-200 flex-shrink-0 transition-all duration-300 ease-in-out ${
          isSidebarCollapsed ? 'w-16' : 'w-64'
        }`}>
          <div className="p-4">
            
            <div className="space-y-2">
              {[
                { id: 'statistics', label: 'Thống kê hệ thống', icon: BarChart3 },
                { id: 'users', label: 'Quản lý người dùng', icon: Users },
                { id: 'reports', label: 'Quản lý báo cáo', icon: ShieldAlert },
                { id: 'export', label: 'Xuất báo cáo', icon: FileSpreadsheet }
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all ${
                    activeTab === id
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  title={isSidebarCollapsed ? label : ''}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isSidebarCollapsed && <span className="whitespace-nowrap">{label}</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Statistics Tab */}
          {activeTab === 'statistics' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-600 text-sm">Tổng người dùng</p>
                    <Users className="w-8 h-8 text-blue-500 opacity-30" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900">{systemStats.users.total.toLocaleString()}</h3>
                  <div className="mt-4 flex items-center gap-4 text-xs">
                    <span className="text-green-600">✓ {systemStats.users.active} hoạt động</span>
                    <span className="text-red-600">✗ {systemStats.users.banned} bị cấm</span>
                    <span className="text-blue-600">+ {systemStats.users.newToday} mới hôm nay</span>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-600 text-sm">Chiến dịch gây quỹ</p>
                    <TrendingUp className="w-8 h-8 text-green-500 opacity-30" />
                  </div>
                  <h3 className="text-3xl font-bold text-gray-900">{systemStats.campaigns.total}</h3>
                  <div className="mt-4 flex items-center gap-4 text-xs">
                    <span className="text-green-600">{systemStats.campaigns.active} đang hoạt động</span>
                    <span className="text-blue-600">{systemStats.campaigns.completed} hoàn thành</span>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-600 text-sm">Số dư quỹ hiện tại</p>
                    <DollarSign className="w-8 h-8 text-green-500 opacity-30" />
                  </div>
                  <h3 className="text-3xl font-bold text-green-600">{formatCurrency(systemStats.fund.currentBalance)}</h3>
                  <div className="mt-4 text-xs text-gray-600">
                    Đã gây quỹ: {formatCurrency(systemStats.fund.totalRaised)}
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-gray-600 text-sm">Báo cáo chờ xử lý</p>
                    <AlertTriangle className="w-8 h-8 text-orange-500 opacity-30" />
                  </div>
                  <h3 className="text-3xl font-bold text-orange-600">{systemStats.reports.pending}</h3>
                  <div className="mt-4 text-xs text-gray-600">
                    Tổng: {systemStats.reports.total} báo cáo
                  </div>
                </div>
              </div>

              {/* Detailed Stats */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Thống kê người dùng</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="font-medium text-gray-700">Người dùng hoạt động</span>
                      <span className="text-2xl font-bold text-green-600">{systemStats.users.active}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <span className="font-medium text-gray-700">Người dùng bị cấm</span>
                      <span className="text-2xl font-bold text-red-600">{systemStats.users.banned}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium text-gray-700">Người dùng mới hôm nay</span>
                      <span className="text-2xl font-bold text-blue-600">{systemStats.users.newToday}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Thống kê quỹ</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="font-medium text-gray-700">Tổng đã gây quỹ</span>
                      <span className="text-xl font-bold text-green-600">{formatCurrency(systemStats.fund.totalRaised)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                      <span className="font-medium text-gray-700">Tổng đã rút</span>
                      <span className="text-xl font-bold text-red-600">{formatCurrency(systemStats.fund.totalWithdrawn)}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium text-gray-700">Số dư hiện tại</span>
                      <span className="text-xl font-bold text-blue-600">{formatCurrency(systemStats.fund.currentBalance)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Thống kê báo cáo</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                      <span className="font-medium text-gray-700">Chờ xử lý</span>
                      <span className="text-2xl font-bold text-orange-600">{systemStats.reports.pending}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="font-medium text-gray-700">Đã xử lý vi phạm</span>
                      <span className="text-2xl font-bold text-green-600">{systemStats.reports.resolved}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span className="font-medium text-gray-700">Đã bỏ qua</span>
                      <span className="text-2xl font-bold text-gray-600">{systemStats.reports.dismissed}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">Chiến dịch gây quỹ</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="font-medium text-gray-700">Đang hoạt động</span>
                      <span className="text-2xl font-bold text-green-600">{systemStats.campaigns.active}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium text-gray-700">Hoàn thành</span>
                      <span className="text-2xl font-bold text-blue-600">{systemStats.campaigns.completed}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                      <span className="font-medium text-gray-700">Sắp diễn ra</span>
                      <span className="text-2xl font-bold text-purple-600">{systemStats.campaigns.upcoming}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Transaction Stats */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Giao dịch quỹ</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700">Tổng thu nhập</span>
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(systemStats.transactions.income)}</p>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700">Tổng chi tiêu</span>
                      <TrendingDown className="w-6 h-6 text-red-600" />
                    </div>
                    <p className="text-3xl font-bold text-red-600">{formatCurrency(systemStats.transactions.expense)}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h3>
                <div className="flex items-center gap-3">
                  <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                    <UserPlus className="w-4 h-4" />
                    Thêm người dùng
                  </button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={userSearch}
                    onChange={(e) => setUserSearch(e.target.value)}
                    placeholder="Tìm kiếm theo tên, username hoặc email..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <select
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="admin">Quản trị viên</option>
                  <option value="moderator">Điều hành viên</option>
                  <option value="user">Người dùng</option>
                </select>
                <select
                  value={userStatusFilter}
                  onChange={(e) => setUserStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="active">Hoạt động</option>
                  <option value="inactive">Vô hiệu</option>
                  <option value="banned">Bị cấm</option>
                </select>
              </div>

              {/* Users Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Họ Tên</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Username</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Vai trò</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ngày tạo</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">{user.fullname}</td>
                        <td className="px-4 py-3 text-gray-700">@{user.username}</td>
                        <td className="px-4 py-3 text-gray-700">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                            user.role === 'moderator' ? 'bg-blue-100 text-blue-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {user.role === 'admin' ? 'Quản trị' : user.role === 'moderator' ? 'Điều hành' : 'Người dùng'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            user.status === 'active' ? 'bg-green-100 text-green-700' :
                            user.status === 'inactive' ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {user.status === 'active' ? 'Hoạt động' : user.status === 'inactive' ? 'Vô hiệu' : 'Bị cấm'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-700">{formatDate(user.createdAt)}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserDetail(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {user.status !== 'active' && (
                              <button
                                onClick={() => handleUserStatusChange(user.id, 'active')}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Kích hoạt"
                              >
                                <Check className="w-4 h-4" />
                              </button>
                            )}
                            {user.status !== 'banned' && (
                              <button
                                onClick={() => handleUserStatusChange(user.id, 'banned')}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Cấm"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Reports Tab */}
          {activeTab === 'reports' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Quản lý báo cáo</h3>

              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <select
                  value={reportStatusFilter}
                  onChange={(e) => setReportStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chờ xử lý</option>
                  <option value="resolved">Đã xử lý vi phạm</option>
                  <option value="dismissed">Đã bỏ qua</option>
                </select>
                <select
                  value={reportTypeFilter}
                  onChange={(e) => setReportTypeFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">Tất cả loại</option>
                  <option value="post">Bài viết</option>
                  <option value="comment">Bình luận</option>
                  <option value="user">Người dùng</option>
                  <option value="campaign">Chiến dịch</option>
                </select>
              </div>

              {/* Reports List */}
              <div className="space-y-4">
                {filteredReports.map((report) => (
                  <div key={report.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-900 mb-1">{report.reportedObject}</h4>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                          <span>Báo cáo bởi: {report.reportedBy}</span>
                          <span>•</span>
                          <span className="font-medium">{formatDate(report.createdAt)}</span>
                        </div>
                        <p className="text-gray-700">{report.description}</p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          report.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                          report.status === 'resolved' ? 'bg-green-100 text-green-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {report.status === 'pending' ? 'Chờ xử lý' :
                           report.status === 'resolved' ? 'Đã xử lý vi phạm' : 'Đã bỏ qua'}
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                          {report.reportType === 'post' ? 'Bài viết' :
                           report.reportType === 'comment' ? 'Bình luận' :
                           report.reportType === 'user' ? 'Người dùng' : 'Chiến dịch'}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-3 pt-3 border-t border-gray-200">
                      {report.relatedUrl && (
                        <button
                          onClick={() => navigate(report.relatedUrl!)}
                          className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg hover:bg-indigo-100 transition-colors text-sm font-semibold"
                        >
                          <ExternalLink className="w-4 h-4" />
                          Xem nội dung
                        </button>
                      )}
                      {report.status === 'pending' && (
                        <>
                          <button
                            onClick={() => {
                              setSelectedReport(report);
                              setShowReportDetail(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-semibold"
                          >
                            <Eye className="w-4 h-4" />
                            Xem chi tiết
                          </button>
                          <button
                            onClick={() => handleReportAction(report.id, 'resolve')}
                            className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors text-sm font-semibold"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                            Xử lý vi phạm
                          </button>
                          <button
                            onClick={() => handleReportAction(report.id, 'dismiss')}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors text-sm font-semibold"
                          >
                            <X className="w-4 h-4" />
                            Bỏ qua
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Export Tab */}
          {activeTab === 'export' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Xuất báo cáo hệ thống</h3>
                <p className="text-gray-600 mb-6">Tải xuống dữ liệu hệ thống dưới dạng file CSV/Excel</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Users Export */}
                  <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">Danh sách người dùng</h4>
                        <p className="text-sm text-gray-600">{users.length} người dùng</p>
                      </div>
                    </div>
                    <button
                      onClick={handleExportUsers}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                    >
                      <Download className="w-4 h-4" />
                      Xuất CSV
                    </button>
                  </div>

                  {/* Reports Export */}
                  <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                        <AlertTriangle className="w-6 h-6 text-orange-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">Danh sách báo cáo</h4>
                        <p className="text-sm text-gray-600">{reports.length} báo cáo</p>
                      </div>
                    </div>
                    <button
                      onClick={handleExportReports}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-semibold"
                    >
                      <Download className="w-4 h-4" />
                      Xuất CSV
                    </button>
                  </div>

                  {/* Statistics Export */}
                  <div className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-green-600" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">Thống kê hệ thống</h4>
                        <p className="text-sm text-gray-600">Tổng quan hệ thống</p>
                      </div>
                    </div>
                    <button
                      onClick={handleExportStatistics}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold"
                    >
                      <Download className="w-4 h-4" />
                      Xuất CSV
                    </button>
                  </div>

                  {/* Export All */}
                  <div className="border-2 border-blue-500 rounded-lg p-6 hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-indigo-50">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <FileSpreadsheet className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">Xuất tất cả</h4>
                        <p className="text-sm text-gray-600">Tất cả dữ liệu</p>
                      </div>
                    </div>
                    <button
                      onClick={handleExportAll}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all font-semibold shadow-md"
                    >
                      <Download className="w-4 h-4" />
                      Xuất tất cả (CSV)
                    </button>
                  </div>
                </div>

                {/* Additional Info */}
                <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h5 className="font-semibold text-blue-900 mb-1">Lưu ý về định dạng file</h5>
                      <p className="text-sm text-blue-800">
                        Các file CSV có thể được mở bằng Microsoft Excel, Google Sheets, hoặc bất kỳ chương trình bảng tính nào. 
                        File sẽ tự động tải xuống trong thư mục Downloads của bạn.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Detail Modal */}
      {showUserDetail && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Chi tiết người dùng</h3>
              <button
                onClick={() => {
                  setShowUserDetail(false);
                  setSelectedUser(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-gray-200">
                  <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-3xl font-bold text-blue-600">{selectedUser.fullname.charAt(0)}</span>
                  </div>
                  <div>
                    <h4 className="text-2xl font-bold text-gray-900">{selectedUser.fullname}</h4>
                    <p className="text-gray-600">@{selectedUser.username}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-gray-600 mb-2">Email</h5>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-gray-600 mb-2">Vai trò</h5>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedUser.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      selectedUser.role === 'moderator' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedUser.role === 'admin' ? 'Quản trị viên' : selectedUser.role === 'moderator' ? 'Điều hành viên' : 'Người dùng'}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-gray-600 mb-2">Trạng thái</h5>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedUser.status === 'active' ? 'bg-green-100 text-green-700' :
                      selectedUser.status === 'inactive' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {selectedUser.status === 'active' ? 'Hoạt động' : selectedUser.status === 'inactive' ? 'Vô hiệu' : 'Bị cấm'}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-gray-600 mb-2">Ngày tạo</h5>
                    <p className="font-medium">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-gray-600 mb-2">Lần đăng nhập cuối</h5>
                  <p className="font-medium">{formatDate(selectedUser.lastLogin)}</p>
                </div>
              </div>
              <div className="flex gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => {
                    setShowUserDetail(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Report Detail Modal */}
      {showReportDetail && selectedReport && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
            <div className="sticky top-0 bg-gradient-to-r from-orange-600 to-red-600 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold">Chi tiết báo cáo</h3>
              <button
                onClick={() => {
                  setShowReportDetail(false);
                  setSelectedReport(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-gray-900 mb-2">{selectedReport.reportedObject}</h4>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-sm text-gray-600">Báo cáo bởi: <span className="font-semibold">{selectedReport.reportedBy}</span></span>
                    <span className="text-gray-400">•</span>
                    <span className="text-sm text-gray-600">{formatDate(selectedReport.createdAt)}</span>
                  </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 border-l-4 border-orange-500">
                  <h5 className="text-sm font-semibold text-orange-800 mb-2">Lý do báo cáo</h5>
                  <p className="font-medium text-gray-900">{selectedReport.reason}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">Mô tả chi tiết</h5>
                  <p className="text-gray-700">{selectedReport.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-gray-600 mb-2">Loại báo cáo</h5>
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold">
                      {selectedReport.reportType === 'post' ? 'Bài viết' :
                       selectedReport.reportType === 'comment' ? 'Bình luận' :
                       selectedReport.reportType === 'user' ? 'Người dùng' : 'Chiến dịch'}
                    </span>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-gray-600 mb-2">Trạng thái</h5>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      selectedReport.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                      selectedReport.status === 'resolved' ? 'bg-green-100 text-green-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedReport.status === 'pending' ? 'Chờ xử lý' :
                       selectedReport.status === 'resolved' ? 'Đã xử lý vi phạm' : 'Đã bỏ qua'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3 mt-6 pt-6 border-t">
                {selectedReport.relatedUrl && (
                  <button
                    onClick={() => navigate(selectedReport.relatedUrl!)}
                    className="flex items-center gap-2 px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-semibold"
                  >
                    <ExternalLink className="w-5 h-5" />
                    Xem nội dung
                  </button>
                )}
                {selectedReport.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        handleReportAction(selectedReport.id, 'resolve');
                      }}
                      className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-semibold flex items-center justify-center gap-2"
                    >
                      <CheckCircle2 className="w-5 h-5" />
                      Xử lý vi phạm
                    </button>
                    <button
                      onClick={() => {
                        handleReportAction(selectedReport.id, 'dismiss');
                      }}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Bỏ qua
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPage;
