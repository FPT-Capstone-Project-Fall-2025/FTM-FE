import React from 'react';
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  Eye,
  Edit,
} from 'lucide-react';
import type { Fund } from '@/types/fund';
import { EmptyState, LoadingState } from './FundLoadingEmpty';

export interface OverviewContributor {
  id: string;
  name: string;
  amount: number;
  date: string;
}

export interface OverviewTransaction {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  date: string;
  description: string;
  status: string;
}

interface FundOverviewSectionProps {
  activeFund: Fund | null;
  computedBalance: number;
  totalIncome: number;
  totalExpense: number;
  uniqueContributorCount: number;
  pendingExpenseCount: number;
  currentFundPurpose: string;
  lastUpdated: string;
  recentContributors: OverviewContributor[];
  transactions: OverviewTransaction[];
  formatCurrency: (value?: number | null) => string;
  formatDate: (value?: string | null) => string;
  onNavigateHistory: () => void;
  loading?: boolean;
  onDeposit?: () => void;
  depositDisabled?: boolean;
  showDepositButton?: boolean;
  onWithdraw?: () => void;
  withdrawDisabled?: boolean;
  showWithdrawButton?: boolean;
  onEdit?: () => void;
  isOwner?: boolean;
}

const FundOverviewSection: React.FC<FundOverviewSectionProps> = ({
  activeFund,
  computedBalance,
  totalIncome,
  totalExpense,
  uniqueContributorCount,
  pendingExpenseCount,
  currentFundPurpose,
  lastUpdated,
  recentContributors,
  transactions,
  formatCurrency,
  formatDate,
  onNavigateHistory,
  loading = false,
  onDeposit,
  depositDisabled = false,
  showDepositButton = true,
  onWithdraw,
  withdrawDisabled = false,
  showWithdrawButton = true,
  onEdit,
  isOwner = false,
}) => {
  const approvedIncome = React.useMemo(() => {
    const ok = new Set(['đã xác nhận', 'confirmed', 'completed', 'đã phê duyệt', 'approved']);
    return transactions
      .filter(t => t.type === 'income' && ok.has(String(t.status || '').trim().toLowerCase()))
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [transactions]);

  const approvedExpense = React.useMemo(() => {
    const ok = new Set(['đã phê duyệt', 'approved']);
    return transactions
      .filter(t => t.type === 'expense' && ok.has(String(t.status || '').trim().toLowerCase()))
      .reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [transactions]);

  if (loading) {
    return <LoadingState message="Đang cập nhật dữ liệu quỹ" />;
  }

  if (!activeFund) {
    return (
      <EmptyState
        icon={<Wallet className="w-12 h-12 text-gray-400" />}
        title="Chưa có thông tin quỹ cho gia phả này"
        description="Vui lòng tạo quỹ mới hoặc liên hệ quản trị viên để được cấp quyền."
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
          {isOwner && onEdit && (
                <button
                  onClick={onEdit}
                  className="mb-2 flex items-center gap-1 px-3 py-1.5 bg-white/20 hover:bg-white/30 text-white text-sm font-semibold rounded-lg transition-colors"
                  type="button"
                  title="Chỉnh sửa thông tin Quỹ"
                >
                  <Edit className="w-4 h-4" />
                  Chỉnh sửa thông tin Quỹ
                </button>
              )}
            <div className="flex items-center justify-between mb-2">
              
              <p className="text-blue-100 text-sm font-medium">
                Số dư hiện tại
              </p>
              
            </div>
            <h3 className="text-4xl font-bold mb-1">
              {formatCurrency(computedBalance)}
            </h3>
            <p className="text-blue-100 text-sm">Cập nhật: {lastUpdated}</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {showDepositButton && onDeposit && (
                <button
                  onClick={onDeposit}
                  disabled={depositDisabled}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  type="button"
                >
                  Đóng góp
                </button>
              )}
              {showWithdrawButton && onWithdraw && (
                <button
                  onClick={onWithdraw}
                  disabled={withdrawDisabled}
                  className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  type="button"
                >
                  Rút
                </button>
              )}
            </div>
            <Wallet className="w-20 h-20 text-blue-200 opacity-50" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm">Tổng thu</p>
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
          <h4 className="text-2xl font-bold text-emerald-600">
            {formatCurrency(approvedIncome)}
          </h4>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm">Tổng chi</p>
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
          <h4 className="text-2xl font-bold text-red-600">
            {formatCurrency(approvedExpense)}
          </h4>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm">Người đóng góp</p>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <h4 className="text-2xl font-bold text-blue-600">
            {uniqueContributorCount}
          </h4>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-gray-600 text-sm">Đang chờ xử lý</p>
            <Clock className="w-5 h-5 text-amber-500" />
          </div>
          <h4 className="text-2xl font-bold text-amber-600">
            {pendingExpenseCount}
          </h4>
          <p className="text-gray-700 leading-relaxed">{currentFundPurpose}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            Người đóng góp gần đây
          </h3>
          <span className="text-sm text-gray-500">
            {recentContributors.length} giao dịch
          </span>
        </div>
        {recentContributors.length === 0 ? (
          <EmptyState
            icon={<Users className="w-10 h-10 text-gray-300" />}
            title="Chưa có đóng góp nào"
            description="Khi có người đóng góp, thông tin sẽ xuất hiện tại đây."
          />
        ) : (
          <div className="space-y-3">
            {recentContributors.map(contributor => (
              <div
                key={contributor.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-lg">
                      {contributor.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {contributor.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(contributor.date)}
                    </p>
                  </div>
                </div>
                <p className="text-emerald-600 font-bold">
                  {formatCurrency(contributor.amount)}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900">
            Lịch sử giao dịch gần đây
          </h3>
          <button
            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
            onClick={onNavigateHistory}
            type="button"
          >
            Xem toàn bộ
            <Eye className="w-4 h-4" />
          </button>
        </div>
        {transactions.length === 0 ? (
          <EmptyState
            icon={<Wallet className="w-10 h-10 text-gray-300" />}
            title="Chưa có giao dịch"
            description="Những giao dịch gần đây sẽ hiển thị tại đây."
          />
        ) : (
          <div className="space-y-3">
            {transactions.map(transaction => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {transaction.type === 'income' ? (
                    <TrendingUp className="w-5 h-5 text-emerald-500" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-red-500" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">
                      {transaction.description}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(transaction.date)}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p
                    className={`font-bold ${transaction.type === 'income' ? 'text-emerald-600' : 'text-red-600'}`}
                  >
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(transaction.amount)}
                  </p>
                  <span className="text-xs text-gray-400 capitalize">
                    {transaction.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FundOverviewSection;
