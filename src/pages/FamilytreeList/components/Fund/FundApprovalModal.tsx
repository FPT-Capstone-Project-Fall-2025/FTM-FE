import React from 'react';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { FundExpense } from '@/types/fund';

interface FundApprovalModalProps {
  isOpen: boolean;
  action: 'approve' | 'reject' | null;
  expense: FundExpense | null;
  note: string;
  onNoteChange: (value: string) => void;
  onCancel: () => void;
  onConfirm: () => void;
  submitting?: boolean;
  formatCurrency: (value?: number | null) => string;
}

const FundApprovalModal: React.FC<FundApprovalModalProps> = ({
  isOpen,
  action,
  expense,
  note,
  onNoteChange,
  onCancel,
  onConfirm,
  submitting = false,
  formatCurrency,
}) => {
  if (!isOpen || !expense || !action) return null;

  const isApprove = action === 'approve';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-4">
            {isApprove ? (
              <CheckCircle className="w-12 h-12 text-emerald-600" />
            ) : (
              <XCircle className="w-12 h-12 text-red-600" />
            )}
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                {isApprove ? 'Phê duyệt yêu cầu' : 'Từ chối yêu cầu'}
              </h3>
              <p className="text-sm text-gray-600 mt-1">Số tiền: {formatCurrency(expense.expenseAmount)}</p>
            </div>
          </div>

      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">Ghi chú</label>
        <textarea
          value={note}
          onChange={e => onNoteChange(e.target.value)}
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Ghi chú cho quyết định (tuỳ chọn)"
        />
      </div>


      <div className="flex gap-3">
        <button
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          type="button"
          disabled={submitting}
        >
          Hủy
        </button>
        <button
          onClick={onConfirm}
          className={`flex-1 px-4 py-2 rounded-lg font-semibold text-white transition-colors ${
            isApprove ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
          } disabled:opacity-60 disabled:cursor-not-allowed`}
          type="button"
          disabled={submitting}
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Đang xử lý...
            </span>
          ) : isApprove ? (
            'Xác nhận phê duyệt'
          ) : (
            'Xác nhận từ chối'
          )}
        </button>
      </div>
    </div>
  </div>
</div>
  );
};

export default FundApprovalModal;
