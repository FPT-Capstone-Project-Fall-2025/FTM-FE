import React from 'react';
import { TrendingDown } from 'lucide-react';
import type { FundExpense } from '@/types/fund';
import { EmptyState } from './FundLoadingEmpty';

interface FundHistorySectionProps {
  approvedExpenses: FundExpense[];
  formatCurrency: (value?: number | null) => string;
  formatDate: (value?: string | null) => string;
}

const FundHistorySection: React.FC<FundHistorySectionProps> = ({
  approvedExpenses,
  formatCurrency,
  formatDate,
}) => (
  <div className="bg-white rounded-lg shadow p-6">
    <div className="flex items-center justify-between mb-6">
      <h3 className="text-2xl font-bold text-gray-900">Lịch sử chi tiêu đã phê duyệt</h3>
      <span className="text-sm text-gray-500">{approvedExpenses.length} giao dịch</span>
    </div>

    {approvedExpenses.length === 0 ? (
      <EmptyState
        icon={<TrendingDown className="w-12 h-12 text-gray-300" />}
        title="Chưa có chi tiêu nào"
        description="Những giao dịch chi tiêu đã phê duyệt sẽ hiển thị ở đây."
      />
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-600">
              <th className="px-4 py-3 font-semibold">Số tiền</th>
              <th className="px-4 py-3 font-semibold">Ngày</th>
              <th className="px-4 py-3 font-semibold">Người nhận</th>
              <th className="px-4 py-3 font-semibold">Lý do</th>
              <th className="px-4 py-3 font-semibold">Phê duyệt bởi</th>
            </tr>
          </thead>
          <tbody>
            {approvedExpenses.map(expense => (
              <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-bold text-red-600">{formatCurrency(expense.expenseAmount)}</td>
                <td className="px-4 py-3 text-gray-700">{formatDate(expense.approvedOn || expense.createdOn)}</td>
                <td className="px-4 py-3 text-gray-700">{expense.recipient || '—'}</td>
                <td className="px-4 py-3 text-gray-700">{expense.expenseDescription || '—'}</td>
                <td className="px-4 py-3 text-gray-700">{expense.approvedBy || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

export default FundHistorySection;
