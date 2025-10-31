import React, { useState } from 'react';
import { useAppSelector } from '@/hooks/redux';
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Plus,
  Search,
  Eye,
  X,
  Megaphone,
  AlertCircle
} from 'lucide-react';
import { toast } from 'react-toastify';

// Mock Types
interface Contributor {
  id: string;
  name: string;
  amount: number;
  date: string;
  avatar?: string;
}

interface Transaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  description: string;
  status?: 'pending' | 'approved' | 'rejected';
}

interface WithdrawalTransaction {
  id: string;
  amount: number;
  reason: string;
  recipient: string;
  relatedEvent: string;
  date: string;
  requestedBy: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
}

interface Campaign {
  id: string;
  name: string;
  purpose: string;
  organizer: string;
  startDate: string;
  endDate: string;
  targetAmount: number;
  raisedAmount: number;
  status: 'active' | 'completed' | 'cancelled';
  contributors: Contributor[];
}

interface FundInfo {
  currentBalance: number;
  fundPurpose: string;
  lastUpdated: string;
  totalIncome: number;
  totalExpense: number;
}

const FundManagement: React.FC = () => {
  const selectedTree = useAppSelector(state => state.familyTreeMetaData.selectedFamilyTree);
  
  const [activeSection, setActiveSection] = useState<'overview' | 'withdrawal' | 'approvals' | 'history' | 'campaigns'>('overview');
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showCampaignDetailModal, setShowCampaignDetailModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showApprovalFeedback, setShowApprovalFeedback] = useState(false);
  const [pendingTransaction, setPendingTransaction] = useState<WithdrawalTransaction | null>(null);
  const [approvalAction, setApprovalAction] = useState<'approve' | 'reject' | null>(null);
  const [campaignSearch, setCampaignSearch] = useState('');
  const [campaignFilter, setCampaignFilter] = useState<'all' | 'active' | 'completed' | 'cancelled'>('all');

  // Mock Fund Info
  const [fundInfo, setFundInfo] = useState<FundInfo>({
    currentBalance: 125000000,
    fundPurpose: 'Quỹ dành cho việc bảo tồn tài sản gia tộc, hỗ trợ giáo dục thành viên, và tổ chức các hoạt động cộng đồng gia đình.',
    lastUpdated: '2024-01-15T10:30:00',
    totalIncome: 250000000,
    totalExpense: 125000000
  });

  // Mock Contributors
  const [contributors] = useState<Contributor[]>([
    { id: '1', name: 'Nguyễn Văn A', amount: 5000000, date: '2024-01-10', avatar: '' },
    { id: '2', name: 'Trần Thị B', amount: 3000000, date: '2024-01-12', avatar: '' },
    { id: '3', name: 'Lê Văn C', amount: 10000000, date: '2024-01-15', avatar: '' },
    { id: '4', name: 'Phạm Thị D', amount: 2000000, date: '2023-12-20', avatar: '' },
    { id: '5', name: 'Hoàng Văn E', amount: 7500000, date: '2023-12-25', avatar: '' }
  ]);

  // Mock Transactions
  const [transactions] = useState<Transaction[]>([
    { id: '1', type: 'income', amount: 5000000, date: '2024-01-10', description: 'Đóng góp từ Nguyễn Văn A' },
    { id: '2', type: 'expense', amount: 3000000, date: '2024-01-08', description: 'Chi phí tổ chức Tết Nguyên Đán' },
    { id: '3', type: 'income', amount: 3000000, date: '2024-01-12', description: 'Đóng góp từ Trần Thị B' },
    { id: '4', type: 'expense', amount: 10000000, date: '2024-01-05', description: 'Hỗ trợ học bổng thành viên' },
    { id: '5', type: 'income', amount: 10000000, date: '2024-01-15', description: 'Đóng góp từ Lê Văn C' }
  ]);

  // Mock Pending Withdrawals
  const [pendingWithdrawals, setPendingWithdrawals] = useState<WithdrawalTransaction[]>([
    { 
      id: '1', 
      amount: 5000000, 
      reason: 'Chi phí sửa chữa nhà thờ tộc', 
      recipient: 'Nguyễn Văn X',
      relatedEvent: 'Không',
      date: '2024-01-20',
      requestedBy: 'Nguyễn Văn A',
      status: 'pending'
    },
    { 
      id: '2', 
      amount: 8000000, 
      reason: 'Hỗ trợ khẩn cấp cho thành viên ốm nặng', 
      recipient: 'Trần Thị Y',
      relatedEvent: 'Không',
      date: '2024-01-18',
      requestedBy: 'Trần Thị B',
      status: 'pending'
    }
  ]);

  // Mock Approved Withdrawals
  const [approvedWithdrawals] = useState<WithdrawalTransaction[]>([
    { 
      id: '3', 
      amount: 3000000, 
      reason: 'Chi phí tổ chức Tết Nguyên Đán', 
      recipient: 'Lê Văn Z',
      relatedEvent: 'Tết 2024',
      date: '2024-01-08',
      requestedBy: 'Lê Văn C',
      status: 'approved',
      approvedBy: 'Quản trị viên'
    },
    { 
      id: '4', 
      amount: 10000000, 
      reason: 'Hỗ trợ học bổng thành viên', 
      recipient: 'Phạm Thị W',
      relatedEvent: 'Học bổng 2024',
      date: '2024-01-05',
      requestedBy: 'Phạm Thị D',
      status: 'approved',
      approvedBy: 'Quản trị viên'
    }
  ]);

  // Mock Campaigns
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    {
      id: '1',
      name: 'Xây dựng đình làng',
      purpose: 'Gây quỹ để xây dựng lại đình làng truyền thống của gia tộc',
      organizer: 'Nguyễn Văn A',
      startDate: '2024-01-01',
      endDate: '2024-06-30',
      targetAmount: 500000000,
      raisedAmount: 280000000,
      status: 'active',
      contributors: contributors
    },
    {
      id: '2',
      name: 'Học bổng khuyến học',
      purpose: 'Hỗ trợ học phí cho các thành viên xuất sắc',
      organizer: 'Trần Thị B',
      startDate: '2023-09-01',
      endDate: '2023-12-31',
      targetAmount: 100000000,
      raisedAmount: 95000000,
      status: 'completed',
      contributors: contributors.slice(0, 3)
    },
    {
      id: '3',
      name: 'Quỹ tương trợ khẩn cấp',
      purpose: 'Hỗ trợ thành viên gặp khó khăn',
      organizer: 'Lê Văn C',
      startDate: '2024-02-01',
      endDate: '2024-12-31',
      targetAmount: 200000000,
      raisedAmount: 50000000,
      status: 'active',
      contributors: contributors.slice(0, 2)
    }
  ]);

  // Withdrawal Form State
  const [withdrawalForm, setWithdrawalForm] = useState({
    amount: '',
    reason: '',
    recipient: '',
    relatedEvent: '',
    date: new Date().toISOString().split('T')[0]
  });

  // Campaign Form State
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    purpose: '',
    organizer: selectedTree?.owner || '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    targetAmount: ''
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

  // Calculate Campaign Progress
  const calculateProgress = (raised: number, target: number): number => {
    return Math.min((raised / target) * 100, 100);
  };

  // Handle Withdrawal Submit
  const handleWithdrawalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(withdrawalForm.amount);
    
    if (amount <= 0) {
      toast.error('Số tiền phải lớn hơn 0');
      return;
    }

    if (amount > fundInfo.currentBalance) {
      toast.error('Số tiền vượt quá số dư hiện tại');
      return;
    }

    if (!withdrawalForm.reason || !withdrawalForm.recipient || !withdrawalForm.date) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    const newWithdrawal: WithdrawalTransaction = {
      id: Date.now().toString(),
      amount: amount,
      reason: withdrawalForm.reason,
      recipient: withdrawalForm.recipient,
      relatedEvent: withdrawalForm.relatedEvent || 'Không',
      date: withdrawalForm.date,
      requestedBy: selectedTree?.owner || 'Thành viên',
      status: 'pending'
    };

    setPendingWithdrawals([...pendingWithdrawals, newWithdrawal]);
    toast.success('Yêu cầu rút tiền đã được gửi!');
    setWithdrawalForm({
      amount: '',
      reason: '',
      recipient: '',
      relatedEvent: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  // Handle Campaign Submit
  const handleCampaignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const targetAmount = parseFloat(campaignForm.targetAmount);
    
    if (targetAmount <= 0) {
      toast.error('Số tiền mục tiêu phải lớn hơn 0');
      return;
    }

    if (!campaignForm.name || !campaignForm.purpose || !campaignForm.organizer) {
      toast.error('Vui lòng điền đầy đủ thông tin');
      return;
    }

    if (!campaignForm.startDate || !campaignForm.endDate) {
      toast.error('Vui lòng chọn ngày bắt đầu và ngày kết thúc');
      return;
    }

    if (new Date(campaignForm.endDate) <= new Date(campaignForm.startDate)) {
      toast.error('Ngày kết thúc phải sau ngày bắt đầu');
      return;
    }

    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: campaignForm.name,
      purpose: campaignForm.purpose,
      organizer: campaignForm.organizer,
      startDate: campaignForm.startDate,
      endDate: campaignForm.endDate,
      targetAmount: targetAmount,
      raisedAmount: 0,
      status: 'active',
      contributors: []
    };

    setCampaigns([...campaigns, newCampaign]);
    toast.success('Chiến dịch gây quỹ đã được tạo!');
    setShowCampaignModal(false);
    setCampaignForm({
      name: '',
      purpose: '',
      organizer: selectedTree?.owner || '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      targetAmount: ''
    });
  };

  // Handle Approval
  const handleApproval = (transaction: WithdrawalTransaction, action: 'approve' | 'reject') => {
    setPendingTransaction(transaction);
    setApprovalAction(action);
    setShowApprovalFeedback(true);
  };

  // Confirm Approval
  const confirmApproval = () => {
    if (!pendingTransaction || !approvalAction) return;

    // Remove from pending
    const updatedPending = pendingWithdrawals.filter(t => t.id !== pendingTransaction.id);
    setPendingWithdrawals(updatedPending);

    // Add to approved if approved
    if (approvalAction === 'approve') {
      const approved = {
        ...pendingTransaction,
        status: 'approved' as const,
        approvedBy: 'Quản trị viên'
      };
      approvedWithdrawals.push(approved);
      
      // Update fund balance
      setFundInfo(prev => ({
        ...prev,
        currentBalance: prev.currentBalance - pendingTransaction.amount,
        totalExpense: prev.totalExpense + pendingTransaction.amount
      }));
    }

    toast.success(
      approvalAction === 'approve' 
        ? 'Đã phê duyệt yêu cầu rút tiền!' 
        : 'Đã từ chối yêu cầu rút tiền!'
    );

    setShowApprovalFeedback(false);
    setPendingTransaction(null);
    setApprovalAction(null);
  };

  // Filter Campaigns
  const filteredCampaigns = campaigns.filter(campaign => {
    const matchesSearch = campaign.name.toLowerCase().includes(campaignSearch.toLowerCase()) ||
                         campaign.organizer.toLowerCase().includes(campaignSearch.toLowerCase());
    const matchesFilter = campaignFilter === 'all' || campaign.status === campaignFilter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="h-full overflow-hidden flex flex-col bg-gray-50">
      <div className="flex-1 overflow-hidden flex">
        {/* Left Sidebar Navigation */}
        <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-3 px-6 py-4">
          <Wallet className="w-8 h-8 text-blue-600" />
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Quỹ Gia Tộc</h2>
            <p className="text-sm text-gray-600">{selectedTree?.name}</p>
          </div>
        </div>
          <div className="p-4 space-y-2">
            {[
              { id: 'overview', label: 'Tổng Quan', icon: Wallet },
              { id: 'withdrawal', label: 'Tạo Yêu Cầu', icon: TrendingDown },
              { id: 'approvals', label: 'Phê Duyệt', icon: CheckCircle },
              { id: 'history', label: 'Lịch Sử Giao Dịch', icon: Calendar },
              { id: 'campaigns', label: 'Chiến Dịch', icon: Megaphone }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-semibold transition-all ${
                  activeSection === id
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <Icon className="w-5 h-5" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Overview Section */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Fund Balance Card */}
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium mb-2">Số dư hiện tại</p>
                    <h3 className="text-4xl font-bold mb-1">{formatCurrency(fundInfo.currentBalance)}</h3>
                    <p className="text-blue-100 text-sm">Cập nhật: {formatDate(fundInfo.lastUpdated)}</p>
                  </div>
                  <Wallet className="w-20 h-20 text-blue-200 opacity-50" />
                </div>
              </div>

              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-600 text-sm">Tổng thu nhập</p>
                    <TrendingUp className="w-5 h-5 text-green-500" />
                  </div>
                  <h4 className="text-2xl font-bold text-green-600">{formatCurrency(fundInfo.totalIncome)}</h4>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-600 text-sm">Tổng chi tiêu</p>
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  </div>
                  <h4 className="text-2xl font-bold text-red-600">{formatCurrency(fundInfo.totalExpense)}</h4>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-gray-600 text-sm">Người đóng góp</p>
                    <Users className="w-5 h-5 text-blue-500" />
                  </div>
                  <h4 className="text-2xl font-bold text-blue-600">{contributors.length}</h4>
                </div>
              </div>

              {/* Fund Purpose */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-3">Mục đích quỹ</h3>
                <p className="text-gray-700">{fundInfo.fundPurpose}</p>
              </div>

              {/* Recent Contributors */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Người đóng góp gần đây</h3>
                <div className="space-y-3">
                  {contributors.map((contributor) => (
                    <div key={contributor.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 font-bold">{contributor.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{contributor.name}</p>
                          <p className="text-sm text-gray-500">{formatDate(contributor.date)}</p>
                        </div>
                      </div>
                      <p className="text-green-600 font-bold">{formatCurrency(contributor.amount)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transaction History */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Lịch sử giao dịch</h3>
                <div className="space-y-3">
                  {transactions.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {transaction.type === 'income' ? (
                          <TrendingUp className="w-5 h-5 text-green-500" />
                        ) : (
                          <TrendingDown className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <p className="font-medium text-gray-900">{transaction.description}</p>
                          <p className="text-sm text-gray-500">{formatDate(transaction.date)}</p>
                        </div>
                      </div>
                      <p className={`font-bold ${transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Create Withdrawal Section */}
          {activeSection === 'withdrawal' && (
            <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Tạo yêu cầu rút tiền</h3>
              
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-blue-600" />
                  <p className="font-semibold text-blue-900">Số dư hiện tại</p>
                </div>
                <p className="text-2xl font-bold text-blue-600">{formatCurrency(fundInfo.currentBalance)}</p>
              </div>

              <form onSubmit={handleWithdrawalSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Số tiền <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={withdrawalForm.amount}
                    onChange={(e) => setWithdrawalForm({ ...withdrawalForm, amount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập số tiền"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Lý do chi tiêu <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={withdrawalForm.reason}
                    onChange={(e) => setWithdrawalForm({ ...withdrawalForm, reason: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Mô tả lý do chi tiêu..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Người nhận <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={withdrawalForm.recipient}
                    onChange={(e) => setWithdrawalForm({ ...withdrawalForm, recipient: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tên người nhận"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Sự kiện liên quan
                  </label>
                  <input
                    type="text"
                    value={withdrawalForm.relatedEvent}
                    onChange={(e) => setWithdrawalForm({ ...withdrawalForm, relatedEvent: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tên sự kiện (nếu có)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ngày yêu cầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={withdrawalForm.date}
                    onChange={(e) => setWithdrawalForm({ ...withdrawalForm, date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                >
                  Gửi yêu cầu
                </button>
              </form>
            </div>
          )}

          {/* Approvals Section */}
          {activeSection === 'approvals' && (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Phê duyệt yêu cầu rút tiền</h3>
                
                {pendingWithdrawals.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Không có yêu cầu chờ phê duyệt</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {pendingWithdrawals.map((withdrawal) => (
                      <div key={withdrawal.id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-lg font-bold text-gray-900">{formatCurrency(withdrawal.amount)}</h4>
                            <p className="text-sm text-gray-500">{formatDate(withdrawal.date)}</p>
                          </div>
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-semibold flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            Chờ phê duyệt
                          </span>
                        </div>

                        <div className="space-y-2 mb-4">
                          <div>
                            <span className="text-sm text-gray-600">Lý do: </span>
                            <span className="font-medium">{withdrawal.reason}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Người nhận: </span>
                            <span className="font-medium">{withdrawal.recipient}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Sự kiện: </span>
                            <span className="font-medium">{withdrawal.relatedEvent}</span>
                          </div>
                          <div>
                            <span className="text-sm text-gray-600">Người yêu cầu: </span>
                            <span className="font-medium">{withdrawal.requestedBy}</span>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => handleApproval(withdrawal, 'approve')}
                            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Phê duyệt
                          </button>
                          <button
                            onClick={() => handleApproval(withdrawal, 'reject')}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                          >
                            <XCircle className="w-4 h-4" />
                            Từ chối
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* History Section */}
          {activeSection === 'history' && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-6">Lịch sử chi tiêu</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Số tiền</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Ngày</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Người nhận</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Lý do</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Phê duyệt bởi</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvedWithdrawals.map((withdrawal) => (
                      <tr key={withdrawal.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-4 py-3 font-bold text-red-600">{formatCurrency(withdrawal.amount)}</td>
                        <td className="px-4 py-3 text-gray-700">{formatDate(withdrawal.date)}</td>
                        <td className="px-4 py-3 text-gray-700">{withdrawal.recipient}</td>
                        <td className="px-4 py-3 text-gray-700">{withdrawal.reason}</td>
                        <td className="px-4 py-3 text-gray-700">{withdrawal.approvedBy}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                            Đã phê duyệt
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Campaigns Section */}
          {activeSection === 'campaigns' && (
            <div className="space-y-6">
              {/* Campaign Header */}
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-bold text-gray-900">Chiến dịch gây quỹ</h3>
                  <button
                    onClick={() => setShowCampaignModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Tạo chiến dịch
                  </button>
                </div>

                {/* Search and Filter */}
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={campaignSearch}
                      onChange={(e) => setCampaignSearch(e.target.value)}
                      placeholder="Tìm kiếm theo tên, người tổ chức..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  <select
                    value={campaignFilter}
                    onChange={(e) => setCampaignFilter(e.target.value as any)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">Tất cả</option>
                    <option value="active">Đang diễn ra</option>
                    <option value="completed">Hoàn thành</option>
                    <option value="cancelled">Đã hủy</option>
                  </select>
                </div>

                {/* Campaign List */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredCampaigns.map((campaign) => (
                    <div key={campaign.id} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="text-xl font-bold text-gray-900 mb-1">{campaign.name}</h4>
                          <p className="text-sm text-gray-600">Tổ chức bởi: {campaign.organizer}</p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          campaign.status === 'active' ? 'bg-green-100 text-green-700' :
                          campaign.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {campaign.status === 'active' ? 'Đang diễn ra' :
                           campaign.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
                        </span>
                      </div>

                      <p className="text-gray-700 mb-4">{campaign.purpose}</p>

                      <div className="mb-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Tiến độ</span>
                          <span className="text-sm font-semibold">
                            {formatCurrency(campaign.raisedAmount)} / {formatCurrency(campaign.targetAmount)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-blue-600 h-3 rounded-full transition-all"
                            style={{ width: `${calculateProgress(campaign.raisedAmount, campaign.targetAmount)}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {calculateProgress(campaign.raisedAmount, campaign.targetAmount).toFixed(1)}% hoàn thành
                        </p>
                      </div>

                      <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
                        <div>
                          <span>Bắt đầu: </span>
                          <span className="font-semibold">{formatDate(campaign.startDate)}</span>
                        </div>
                        <div>
                          <span>Kết thúc: </span>
                          <span className="font-semibold">{formatDate(campaign.endDate)}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {campaign.contributors.length} người đóng góp
                        </span>
                        <button 
                          onClick={() => {
                            setSelectedCampaign(campaign);
                            setShowCampaignDetailModal(true);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-semibold"
                        >
                          <Eye className="w-4 h-4" />
                          Xem chi tiết
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredCampaigns.length === 0 && (
                  <div className="text-center py-12">
                    <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Không tìm thấy chiến dịch nào</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">Tạo chiến dịch gây quỹ mới</h3>
              <button
                onClick={() => setShowCampaignModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCampaignSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tên chiến dịch <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="VD: Xây dựng đình làng..."
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Mục đích <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={campaignForm.purpose}
                  onChange={(e) => setCampaignForm({ ...campaignForm, purpose: e.target.value })}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Mô tả mục đích chiến dịch..."
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Người tổ chức <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={campaignForm.organizer}
                    onChange={(e) => setCampaignForm({ ...campaignForm, organizer: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Số tiền mục tiêu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={campaignForm.targetAmount}
                    onChange={(e) => setCampaignForm({ ...campaignForm, targetAmount: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nhập số tiền"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ngày bắt đầu <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={campaignForm.startDate}
                    onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ngày kết thúc <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={campaignForm.endDate}
                    onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold"
                >
                  Tạo chiến dịch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Campaign Detail Modal */}
      {showCampaignDetailModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Megaphone className="w-6 h-6" />
                <h3 className="text-xl font-bold">Chi tiết chiến dịch</h3>
              </div>
              <button
                onClick={() => {
                  setShowCampaignDetailModal(false);
                  setSelectedCampaign(null);
                }}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {/* Campaign Info */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-3xl font-bold text-gray-900 mb-2">{selectedCampaign.name}</h4>
                    <p className="text-gray-600">Tổ chức bởi: <span className="font-semibold">{selectedCampaign.organizer}</span></p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    selectedCampaign.status === 'active' ? 'bg-green-100 text-green-700' :
                    selectedCampaign.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {selectedCampaign.status === 'active' ? 'Đang diễn ra' :
                     selectedCampaign.status === 'completed' ? 'Hoàn thành' : 'Đã hủy'}
                  </span>
                </div>

                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <h5 className="text-sm font-semibold text-blue-800 mb-2 uppercase tracking-wide">Mục đích chiến dịch</h5>
                  <p className="text-gray-700">{selectedCampaign.purpose}</p>
                </div>

                {/* Progress Bar */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-700">Tiến độ gây quỹ</span>
                    <span className="text-lg font-bold text-blue-600">
                      {formatCurrency(selectedCampaign.raisedAmount)} / {formatCurrency(selectedCampaign.targetAmount)}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-4">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-indigo-600 h-4 rounded-full transition-all"
                      style={{ width: `${calculateProgress(selectedCampaign.raisedAmount, selectedCampaign.targetAmount)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-gray-600">
                      {calculateProgress(selectedCampaign.raisedAmount, selectedCampaign.targetAmount).toFixed(1)}% hoàn thành
                    </p>
                    <p className="text-sm font-bold text-gray-900">
                      Còn lại: {formatCurrency(selectedCampaign.targetAmount - selectedCampaign.raisedAmount)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Ngày bắt đầu</h5>
                    <p className="text-lg font-bold text-gray-900">{formatDate(selectedCampaign.startDate)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h5 className="text-sm font-semibold text-gray-600 mb-2 uppercase tracking-wide">Ngày kết thúc</h5>
                    <p className="text-lg font-bold text-gray-900">{formatDate(selectedCampaign.endDate)}</p>
                  </div>
                </div>
              </div>

              {/* Contributors List */}
              <div>
                <h5 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-6 h-6 text-blue-600" />
                  Danh sách người đóng góp ({selectedCampaign.contributors.length})
                </h5>
                {selectedCampaign.contributors.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-lg">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">Chưa có người đóng góp</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedCampaign.contributors.map((contributor) => (
                      <div key={contributor.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-blue-600 font-bold text-lg">{contributor.name.charAt(0)}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{contributor.name}</p>
                            <p className="text-sm text-gray-500">{formatDate(contributor.date)}</p>
                          </div>
                        </div>
                        <p className="text-green-600 font-bold text-lg">{formatCurrency(contributor.amount)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowCampaignDetailModal(false);
                    setSelectedCampaign(null);
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

      {/* Approval Feedback Modal */}
      {showApprovalFeedback && pendingTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                {approvalAction === 'approve' ? (
                  <CheckCircle className="w-12 h-12 text-green-600" />
                ) : (
                  <XCircle className="w-12 h-12 text-red-600" />
                )}
                <div>
                  <h3 className="text-lg font-bold text-gray-900">
                    {approvalAction === 'approve' ? 'Phê duyệt yêu cầu' : 'Từ chối yêu cầu'}
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Bạn có chắc chắn?</p>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-600">Số tiền: </span>
                    <span className="font-bold">{formatCurrency(pendingTransaction.amount)}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Lý do: </span>
                    <span className="font-medium">{pendingTransaction.reason}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Người nhận: </span>
                    <span className="font-medium">{pendingTransaction.recipient}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowApprovalFeedback(false);
                    setPendingTransaction(null);
                    setApprovalAction(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Hủy
                </button>
                <button
                  onClick={confirmApproval}
                  className={`flex-1 px-4 py-2 rounded-lg font-semibold transition-colors ${
                    approvalAction === 'approve'
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  Xác nhận
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FundManagement;

