import React from 'react';
import { Loader2, RefreshCw, Clock, AlertTriangle } from 'lucide-react';
import type { MyPendingDonation } from '@/types/fund';
import { EmptyState } from './FundLoadingEmpty';

interface FundPendingDonationsSectionProps {
  pendingDonations: MyPendingDonation[];
  loading?: boolean;
  onRefresh?: () => void;
  formatCurrency: (value?: number | null) => string;
  formatDate: (value?: string | null) => string;
  getPaymentMethodLabel: (method: unknown) => string;
}

const FundPendingDonationsSection: React.FC<FundPendingDonationsSectionProps> = ({
  pendingDonations,
  loading = false,
  onRefresh,
  formatCurrency,
  formatDate,
  getPaymentMethodLabel,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Yêu cầu nạp của tôi (đang chờ)</h3>
          <p className="text-sm text-gray-500">Các khoản nạp chưa được quản trị viên xác nhận</p>
        </div>
        {onRefresh && (
          <button
            type="button"
            onClick={onRefresh}
            disabled={loading}
            className="inline-flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw
              className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : 'text-gray-600'}`}
            />
            Làm mới
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-10">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
        </div>
      ) : pendingDonations.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle className="w-12 h-12 text-gray-300" />}
          title="Không có yêu cầu nạp đang chờ"
          description="Những yêu cầu nạp quỹ của bạn sẽ hiển thị tại đây cho đến khi được xác nhận."
        />
      ) : (
        <div className="space-y-3">
          {pendingDonations.map(item => (
            <div
              key={item.id}
              className="border border-amber-200 bg-amber-50 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4"
            >
              <div>
                <p className="text-sm text-amber-700 font-semibold uppercase tracking-wide">
                  {item.fundName || 'Quỹ chưa xác định'}
                </p>
                <h4 className="text-xl font-bold text-gray-900">
                  {formatCurrency(item.donationMoney)}
                </h4>
                <p className="text-sm text-gray-600">
                  Phương thức: {getPaymentMethodLabel(item.paymentMethod)}
                </p>
                <p className="text-sm text-gray-600">
                  Ghi chú: {item.paymentNotes?.trim() || 'Không có'}
                </p>
              </div>
              <div className="text-sm text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                {formatDate(item.createdDate)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FundPendingDonationsSection;

