import React, { useMemo } from 'react';
import type { FundDonation } from '@/types/fund';
import { EmptyState } from './FundLoadingEmpty';
import { ArrowDownLeft, Clock } from 'lucide-react';

type DonationStatusKey = 'pending' | 'confirmed' | 'rejected';

interface FundDonationHistorySectionProps {
  donations: FundDonation[];
  formatCurrency: (value?: number | null) => string;
  formatDate: (value?: string | null) => string;
  getPaymentMethodLabel: (method: unknown) => string;
  getDonationStatusKey: (status: unknown) => DonationStatusKey;
}

const statusStyles: Record<DonationStatusKey, { label: string; className: string }> = {
  pending: { label: 'Đang chờ', className: 'bg-amber-100 text-amber-700' },
  confirmed: { label: 'Đã xác nhận', className: 'bg-emerald-100 text-emerald-700' },
  rejected: { label: 'Đã từ chối', className: 'bg-red-100 text-red-600' },
};

const FundDonationHistorySection: React.FC<FundDonationHistorySectionProps> = ({
  donations,
  formatCurrency,
  formatDate,
  getPaymentMethodLabel,
  getDonationStatusKey,
}) => {
  const rows = useMemo(() => {
    return donations
      .slice()
      .sort((a, b) => {
        const aDate = new Date(a.confirmedOn ?? a.createdOn ?? '').getTime();
        const bDate = new Date(b.confirmedOn ?? b.createdOn ?? '').getTime();
        return bDate - aDate;
      })
      .map(donation => {
        const statusKey = getDonationStatusKey(donation.status);
        return {
          ...donation,
          statusKey,
          status: statusStyles[statusKey] ?? statusStyles.pending,
        };
      });
  }, [donations, getDonationStatusKey]);

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<ArrowDownLeft className="w-12 h-12 text-gray-300" />}
        title="Chưa có lịch sử nạp quỹ"
        description="Những khoản nạp quỹ sẽ hiển thị tại đây sau khi bạn hoặc các thành viên khác đóng góp."
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-left text-gray-600">
            <th className="px-4 py-3 font-semibold">Số tiền</th>
            <th className="px-4 py-3 font-semibold">Người nạp</th>
            <th className="px-4 py-3 font-semibold">Phương thức</th>
            <th className="px-4 py-3 font-semibold">Ghi chú</th>
            <th className="px-4 py-3 font-semibold">Trạng thái</th>
            <th className="px-4 py-3 font-semibold">Thời gian</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-3 font-bold text-emerald-600">
                {formatCurrency(row.donationMoney)}
              </td>
              <td className="px-4 py-3 text-gray-700">{row.donorName || 'Ẩn danh'}</td>
              <td className="px-4 py-3 text-gray-700">{getPaymentMethodLabel(row.paymentMethod)}</td>
              <td className="px-4 py-3 text-gray-600">{row.paymentNotes || '—'}</td>
              <td className="px-4 py-3">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${row.status.className}`}>
                  {row.status.label}
                </span>
              </td>
              <td className="px-4 py-3 text-gray-600 flex items-center gap-2">
                <Clock className="w-4 h-4 text-gray-400" />
                {formatDate(row.confirmedOn || row.createdOn)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FundDonationHistorySection;

