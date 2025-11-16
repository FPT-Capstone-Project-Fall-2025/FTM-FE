import React from 'react';
import {
  Megaphone,
  X,
  TrendingUp,
  TrendingDown,
  Users,
  Target,
  Calendar,
  Banknote,
  Wallet,
  PiggyBank,
  ClipboardList,
} from 'lucide-react';
import type { CampaignDetail } from './useFundManagementData';
import { EmptyState, LoadingState } from './FundLoadingEmpty';
import type { CampaignExpense, CampaignDonation } from '@/types/fund';

type StatusKey = 'active' | 'upcoming' | 'completed' | 'cancelled';

type DonationStatusKey = 'pending' | 'confirmed' | 'rejected';

type PaymentLabelFn = (method: unknown) => string;

type StatusKeyFn = (status: unknown) => StatusKey;

type DonationStatusFn = (status: unknown) => DonationStatusKey;

interface FundCampaignDetailModalProps {
  isOpen: boolean;
  detail: CampaignDetail | null;
  onClose: () => void;
  onDonate?: (campaignId: string) => void;
  onCreateExpense?: (campaignId: string) => void;
  loading?: boolean;
  formatCurrency: (value?: number | null) => string;
  formatDate: (value?: string | null) => string;
  getCampaignStatusKey: StatusKeyFn;
  getCampaignStatusLabel: (status: StatusKey) => string;
  getCampaignStatusBadgeClasses: (status: StatusKey) => string;
  getDonationStatusKey: DonationStatusFn;
  getPaymentMethodLabel: PaymentLabelFn;
}

const renderDonations = (
  donations: CampaignDonation[],
  formatCurrency: (value?: number | null) => string,
  formatDate: (value?: string | null) => string,
  getPaymentMethodLabel: PaymentLabelFn,
  getDonationStatusKey: DonationStatusFn
) => {
  if (donations.length === 0) {
    return (
      <EmptyState
        icon={<Users className="w-10 h-10 text-gray-300" />}
        title="Chưa có đóng góp"
      />
    );
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
      {donations.map(donation => (
        <div key={donation.id} className="p-3 border border-gray-100 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-gray-900">{donation.donorName || 'Nhà hảo tâm ẩn danh'}</p>
            <span className="text-xs text-gray-500">{formatDate(donation.confirmedOn || donation.createdOn)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-emerald-600 font-semibold">
              {formatCurrency(Number(donation.donationMoney ?? 0))}
            </span>
            <span className="text-gray-500 text-xs">
              {getPaymentMethodLabel(donation.paymentMethod)} · {getDonationStatusKey(donation.status)}
            </span>
          </div>
          {donation.donorNotes && <p className="text-xs text-gray-500 mt-2">{donation.donorNotes}</p>}
        </div>
      ))}
    </div>
  );
};

const renderExpenses = (
  expenses: CampaignExpense[],
  formatCurrency: (value?: number | null) => string,
  formatDate: (value?: string | null) => string
) => {
  if (expenses.length === 0) {
    return (
      <EmptyState
        icon={<TrendingDown className="w-10 h-10 text-gray-300" />}
        title="Chưa ghi nhận chi tiêu"
      />
    );
  }

  return (
    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
      {expenses.map(expense => (
        <div key={expense.id} className="p-3 border border-gray-100 rounded-lg bg-gray-50">
          <div className="flex items-center justify-between mb-1">
            <p className="font-semibold text-gray-900">{expense.expenseTitle || 'Chi tiêu'}</p>
            <span className="text-xs text-gray-500">{formatDate(expense.expenseDate)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-red-600 font-semibold">{formatCurrency(expense.expenseAmount ?? 0)}</span>
            <span className="text-gray-500 text-xs">{expense.category || 'Không có danh mục'}</span>
          </div>
          {expense.notes && <p className="text-xs text-gray-500 mt-2">{expense.notes}</p>}
        </div>
      ))}
    </div>
  );
};

const FundCampaignDetailModal: React.FC<FundCampaignDetailModalProps> = ({
  isOpen,
  detail,
  onClose,
  onDonate,
  onCreateExpense,
  loading = false,
  formatCurrency,
  formatDate,
  getCampaignStatusKey,
  getCampaignStatusLabel,
  getCampaignStatusBadgeClasses,
  getDonationStatusKey,
  getPaymentMethodLabel,
}) => {
  if (!isOpen) return null;

  const statusKey = detail ? getCampaignStatusKey(detail.campaign.status) : 'active';
  const totalDonations = detail?.donations.filter(d => getDonationStatusKey(d.status) === 'confirmed').length ?? 0;
  const stats = detail?.statistics;
  const summary = detail?.financialSummary;
  const progress =
    stats?.progressPercentage ??
    (stats?.fundGoal
      ? ((summary?.totalDonations ?? stats?.raisedAmount ?? 0) / (stats?.fundGoal || 1)) * 100
      : null);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Megaphone className="w-6 h-6" />
            <h3 className="text-xl font-bold">Chi tiết chiến dịch</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors" type="button">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading && <LoadingState message="Đang tải chi tiết chiến dịch" />}

        {!loading && detail && (
          <div className="p-6 space-y-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <h4 className="text-3xl font-bold text-gray-900 mb-2">{detail.campaign.campaignName}</h4>
                <p className="text-gray-600 max-w-2xl">
                  {detail.campaign.campaignDescription || 'Chưa có mô tả chi tiết cho chiến dịch này.'}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold h-fit ${getCampaignStatusBadgeClasses(statusKey)}`}>
                {getCampaignStatusLabel(statusKey)}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase mb-1 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500" />
                  Đã gây quỹ
                </p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary?.totalDonations ?? stats?.raisedAmount ?? detail.campaign.currentBalance ?? 0)}
                </p>
                {typeof progress === 'number' && (
                  <p className="text-sm text-gray-500">{progress.toFixed(1)}% hoàn thành</p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase mb-1 flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-500" />
                  Mục tiêu
                </p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats?.fundGoal ?? detail.campaign.fundGoal ?? 0)}</p>
                {typeof stats?.currentBalance === 'number' && (
                  <p className="text-sm text-gray-500">
                    Đã nhận: {formatCurrency(stats.currentBalance)}
                  </p>
                )}
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase mb-1 flex items-center gap-2">
                  <Users className="w-4 h-4 text-purple-500" />
                  Số người đóng góp
                </p>
                <p className="text-2xl font-bold text-gray-900">{totalDonations}</p>
                {typeof stats?.daysRemaining === 'number' && (
                  <p className="text-sm text-gray-500">
                    {stats.daysRemaining > 0 ? `${stats.daysRemaining} ngày còn lại` : 'Đã kết thúc'}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-gray-600 uppercase mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-500" />
                  Thời gian diễn ra
                </h5>
                <div className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                  <div>
                    <p className="text-gray-500">Bắt đầu</p>
                    <p className="font-semibold">
                      {formatDate(stats?.startDate ?? detail.campaign.startDate)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-500">Kết thúc</p>
                    <p className="font-semibold">
                      {formatDate(stats?.endDate ?? detail.campaign.endDate)}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-white border border-gray-200 rounded-lg p-4">
                <h5 className="text-sm font-semibold text-gray-600 uppercase mb-2 flex items-center gap-2">
                  <Banknote className="w-4 h-4 text-emerald-500" />
                  Thông tin nhận quỹ
                </h5>
                {stats?.bankInfo ? (
                  <div className="space-y-1 text-sm text-gray-700">
                    <p><span className="text-gray-500">Ngân hàng:</span> {stats.bankInfo.bankName || '—'}</p>
                    <p><span className="text-gray-500">Số tài khoản:</span> {stats.bankInfo.bankAccountNumber || '—'}</p>
                    <p><span className="text-gray-500">Mã ngân hàng:</span> {stats.bankInfo.bankCode || '—'}</p>
                    <p><span className="text-gray-500">Chủ tài khoản:</span> {stats.bankInfo.accountHolderName || '—'}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Chưa có thông tin ngân hàng cho chiến dịch này.</p>
                )}
              </div>
            </div>

            {summary && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <h6 className="text-xs uppercase text-gray-500 mb-1 flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-500" />
                    Số dư khả dụng
                  </h6>
                  <p className="text-lg font-bold text-gray-900">
                    {formatCurrency(summary.availableBalance ?? 0)}
                  </p>
                  <p className="text-xs text-gray-500">
                    Chi phí đã duyệt: {formatCurrency(summary.approvedExpenses ?? 0)}
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <h6 className="text-xs uppercase text-gray-500 mb-1 flex items-center gap-2">
                    <PiggyBank className="w-4 h-4 text-blue-500" />
                    Đóng góp & chi tiêu
                  </h6>
                  <p className="text-sm text-gray-600">
                    Tổng đóng góp:{' '}
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(summary.totalDonations ?? 0)}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Tổng chi tiêu:{' '}
                    <span className="font-semibold text-gray-900">
                      {formatCurrency(summary.totalExpenses ?? 0)}
                    </span>
                  </p>
                </div>
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <h6 className="text-xs uppercase text-gray-500 mb-1 flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    Người đóng góp
                  </h6>
                  <p className="text-lg font-bold text-gray-900">
                    {summary.totalDonors ?? 0}
                  </p>
                  {summary.lastDonationDate && (
                    <p className="text-xs text-gray-500">
                      Lần cuối: {formatDate(summary.lastDonationDate)}
                    </p>
                  )}
                </div>
                <div className="border border-gray-200 rounded-lg p-4 bg-white">
                  <h6 className="text-xs uppercase text-gray-500 mb-1 flex items-center gap-2">
                    <ClipboardList className="w-4 h-4 text-amber-500" />
                    Yêu cầu chi tiêu
                  </h6>
                  <p className="text-lg font-bold text-gray-900">
                    {summary.totalExpenseRequests ?? 0}
                  </p>
                  <p className="text-xs text-gray-500">
                    Đang chờ: {summary.pendingExpenses ?? 0}
                  </p>
                  {summary.lastExpenseDate && (
                    <p className="text-xs text-gray-500">
                      Lần cuối: {formatDate(summary.lastExpenseDate)}
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" /> Đóng góp
                </h5>
                {renderDonations(detail.donations, formatCurrency, formatDate, getPaymentMethodLabel, getDonationStatusKey)}
              </div>
              <div className="border border-gray-200 rounded-lg p-4">
                <h5 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-500" /> Chi tiêu chiến dịch
                </h5>
                {renderExpenses(detail.expenses, formatCurrency, formatDate)}
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              {statusKey === 'active' && detail?.campaign.id && onDonate && (
                <button
                  onClick={() => onDonate(detail.campaign.id)}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
                  type="button"
                >
                  Ủng hộ chiến dịch
                </button>
              )}
              {statusKey === 'active' && detail?.campaign.id && onCreateExpense && (
                <button
                  onClick={() => onCreateExpense(detail.campaign.id)}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-semibold"
                  type="button"
                >
                  Tạo yêu cầu rút tiền
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                type="button"
              >
                Đóng
              </button>
            </div>
          </div>
        )}

        {!loading && !detail && (
          <EmptyState title="Không tìm thấy chiến dịch" description="Vui lòng thử lại sau." />
        )}
      </div>
    </div>
  );
};

export default FundCampaignDetailModal;
