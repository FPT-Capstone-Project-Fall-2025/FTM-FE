import React from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import type { FundExpense } from '@/types/fund';
import { EmptyState } from './FundLoadingEmpty';

interface StatusBadge {
  label: string;
  className: string;
}

interface FundApprovalsSectionProps {
  pendingExpenses: FundExpense[];
  formatCurrency: (value?: number | null) => string;
  formatDate: (value?: string | null) => string;
  getStatusBadge: (expense: FundExpense) => StatusBadge;
  onRequestAction: (expense: FundExpense, action: 'approve' | 'reject') => void;
}

const FundApprovalsSection: React.FC<FundApprovalsSectionProps> = ({
  pendingExpenses,
  formatCurrency,
  formatDate,
  getStatusBadge,
  onRequestAction,
}) => {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Yêu cầu rút tiền chờ phê duyệt</h3>
          <p className="text-sm text-gray-500 mt-1">
            Có {pendingExpenses.length} yêu cầu đang chờ xử lý
          </p>
        </div>
      </div>

      {pendingExpenses.length === 0 ? (
        <EmptyState
          icon={<CheckCircle className="w-12 h-12 text-gray-300" />}
          title="Không có yêu cầu nào"
          description="Tất cả yêu cầu đã được xử lý."
        />
      ) : (
        <div className="space-y-4">
          {pendingExpenses.map(expense => {
            const statusBadge = getStatusBadge(expense);
            return (
              <div key={expense.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-gray-900">
                      {formatCurrency(expense.expenseAmount)}
                    </h4>
                    <p className="text-sm text-gray-500">Tạo ngày: {formatDate(expense.createdOn)}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusBadge.className}`}>
                    {statusBadge.label}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600 mb-4">
                  <div>
                    <span className="text-gray-500">Lý do:</span>{' '}
                    <span className="font-medium text-gray-900">{expense.expenseDescription || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Người nhận:</span>{' '}
                    <span className="font-medium text-gray-900">{expense.recipient || '—'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Sự kiện:</span>{' '}
                    <span className="font-medium text-gray-900">{expense.expenseEvent || 'Không có'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Ngày dự kiến:</span>{' '}
                    <span className="font-medium text-gray-900">{formatDate(expense.plannedDate)}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => onRequestAction(expense, 'approve')}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2"
                    type="button"
                  >
                    <CheckCircle className="w-4 h-4" /> Phê duyệt
                  </button>
                  <button
                    onClick={() => onRequestAction(expense, 'reject')}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    type="button"
                  >
                    <XCircle className="w-4 h-4" /> Từ chối
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FundApprovalsSection;
