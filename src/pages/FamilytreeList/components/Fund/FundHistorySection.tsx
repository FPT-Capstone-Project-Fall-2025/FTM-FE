import React, { useMemo } from 'react';
import { TrendingDown, TrendingUp, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import type { FundExpense, FundDonation } from '@/types/fund';
import { EmptyState } from './FundLoadingEmpty';

interface Transaction {
  id: string;
  type: 'donation' | 'expense';
  amount: number;
  date: string;
  description?: string | null;
  recipient?: string | null;
  donorName?: string | null;
  paymentMethod?: string | number | null;
  approvedBy?: string | null;
  donation?: FundDonation;
  expense?: FundExpense;
}

interface FundHistorySectionProps {
  approvedExpenses: FundExpense[];
  confirmedDonations: FundDonation[];
  formatCurrency: (value?: number | null) => string;
  formatDate: (value?: string | null) => string;
  getPaymentMethodLabel?: (method: unknown) => string;
}

const FundHistorySection: React.FC<FundHistorySectionProps> = ({
  approvedExpenses,
  confirmedDonations,
  formatCurrency,
  formatDate,
  getPaymentMethodLabel,
}) => {
  const transactions = useMemo<Transaction[]>(() => {
    const donationTransactions: Transaction[] = confirmedDonations.map(donation => ({
      id: donation.id,
      type: 'donation' as const,
      amount: donation.donationMoney,
      date: donation.confirmedOn || donation.createdOn || '',
      description: donation.paymentNotes || null,
      donorName: donation.donorName || null,
      paymentMethod: donation.paymentMethod,
      donation,
    }));

    const expenseTransactions: Transaction[] = approvedExpenses.map(expense => ({
      id: expense.id,
      type: 'expense' as const,
      amount: expense.expenseAmount,
      date: expense.approvedOn || expense.createdOn || '',
      description: expense.expenseDescription || null,
      recipient: expense.recipient || null,
      approvedBy: expense.approvedBy || null,
      expense,
    }));

    // Combine and sort by date (newest first)
    const all = [...donationTransactions, ...expenseTransactions];
    return all.sort((a, b) => {
      const aDate = new Date(a.date).getTime();
      const bDate = new Date(b.date).getTime();
      return bDate - aDate;
    });
  }, [approvedExpenses, confirmedDonations]);

  const totalTransactions = transactions.length;

  if (totalTransactions === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-bold text-gray-900">Lịch sử giao dịch</h3>
          <span className="text-sm text-gray-500">0 giao dịch</span>
        </div>
        <EmptyState
          icon={<TrendingDown className="w-12 h-12 text-gray-300" />}
          title="Chưa có giao dịch nào"
          description="Những giao dịch nạp và rút tiền thành công sẽ hiển thị ở đây."
        />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Lịch sử giao dịch</h3>
        <span className="text-sm text-gray-500">{totalTransactions} giao dịch</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 text-left text-gray-600">
              <th className="px-4 py-3 font-semibold">Loại</th>
              <th className="px-4 py-3 font-semibold">Số tiền</th>
              <th className="px-4 py-3 font-semibold">Ngày</th>
              <th className="px-4 py-3 font-semibold">Mô tả</th>
              <th className="px-4 py-3 font-semibold">Thông tin thêm</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map(transaction => (
              <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3">
                  {transaction.type === 'donation' ? (
                    <div className="flex items-center gap-2">
                      <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">Nạp</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4 text-red-600" />
                      <span className="text-red-600 font-semibold">Rút</span>
                    </div>
                  )}
                </td>
                <td
                  className={`px-4 py-3 font-bold ${
                    transaction.type === 'donation' ? 'text-emerald-600' : 'text-red-600'
                  }`}
                >
                  {formatCurrency(transaction.amount)}
                </td>
                <td className="px-4 py-3 text-gray-700">{formatDate(transaction.date)}</td>
                <td className="px-4 py-3 text-gray-700">
                  {transaction.description || '—'}
                </td>
                <td className="px-4 py-3 text-gray-700">
                  {transaction.type === 'donation' ? (
                    <div className="space-y-1">
                      {transaction.donorName && (
                        <div className="text-xs">
                          <span className="text-gray-500">Người nạp:</span>{' '}
                          <span className="font-medium">{transaction.donorName}</span>
                        </div>
                      )}
                      {transaction.paymentMethod && getPaymentMethodLabel && (
                        <div className="text-xs">
                          <span className="text-gray-500">Phương thức:</span>{' '}
                          <span className="font-medium">{getPaymentMethodLabel(transaction.paymentMethod)}</span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {transaction.recipient && (
                        <div className="text-xs">
                          <span className="text-gray-500">Người nhận:</span>{' '}
                          <span className="font-medium">{transaction.recipient}</span>
                        </div>
                      )}
                      {transaction.approvedBy && (
                        <div className="text-xs">
                          <span className="text-gray-500">Phê duyệt bởi:</span>{' '}
                          <span className="font-medium">{transaction.approvedBy}</span>
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FundHistorySection;
