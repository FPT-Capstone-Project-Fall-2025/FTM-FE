import React, { useState } from 'react';
import { CheckCircle, XCircle, X, ZoomIn } from 'lucide-react';
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
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const getReceiptImages = (expense: FundExpense): string[] => {
    if (!expense.receiptImages) return [];
    if (Array.isArray(expense.receiptImages)) {
      return expense.receiptImages.filter(Boolean);
    }
    if (typeof expense.receiptImages === 'string') {
      return [expense.receiptImages];
    }
    return [];
  };

  return (
    <div className="bg-white rounded-lg shadow p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Rút tiền</h3>
          <p className="text-sm text-gray-500">
            {pendingExpenses.length > 0
              ? `Có ${pendingExpenses.length} yêu cầu đang chờ xử lý`
              : 'Không có yêu cầu rút tiền đang chờ'}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-0">
        {pendingExpenses.length === 0 ? (
          <EmptyState
            icon={<CheckCircle className="w-12 h-12 text-gray-300" />}
            title="Không có yêu cầu rút tiền"
            description="Tất cả yêu cầu rút tiền đã được xử lý."
          />
        ) : (
          <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-400px)] pr-2">
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

                {/* Receipt Images Section */}
                {(() => {
                  const receiptImages = getReceiptImages(expense);
                  if (receiptImages.length === 0) return null;
                  
                  return (
                    <div className="mb-4">
                      <span className="text-sm text-gray-500 block mb-2">Ảnh hóa đơn/chứng từ:</span>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {receiptImages.map((imageUrl, index) => (
                          <div
                            key={index}
                            className="relative group cursor-pointer rounded-lg overflow-hidden border border-gray-200 hover:border-blue-500 transition-colors"
                            onClick={() => setSelectedImage(imageUrl)}
                          >
                            <img
                              src={imageUrl}
                              alt={`Hóa đơn ${index + 1}`}
                              className="w-full h-32 object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect width="100" height="100" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="12"%3ELỗi tải ảnh%3C/text%3E%3C/svg%3E';
                              }}
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                              <ZoomIn className="w-6 h-6 text-white" />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

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

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors z-10"
              type="button"
              aria-label="Đóng"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImage}
              alt="Hóa đơn phóng to"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect width="400" height="300" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-size="16"%3EKhông thể tải ảnh%3C/text%3E%3C/svg%3E';
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default FundApprovalsSection;
