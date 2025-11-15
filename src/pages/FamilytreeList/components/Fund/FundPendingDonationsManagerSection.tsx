import React, { useState } from 'react';
import { Loader2, RefreshCw, Clock, CheckCircle, XCircle, AlertTriangle, Image } from 'lucide-react';
import type { MyPendingDonation } from '@/types/fund';
import { EmptyState } from './FundLoadingEmpty';

interface FundPendingDonationsManagerSectionProps {
  pendingDonations: MyPendingDonation[];
  loading?: boolean;
  confirming?: boolean;
  rejecting?: boolean;
  onRefresh?: () => void;
  onConfirm: (donationId: string, confirmationNotes?: string) => Promise<void>;
  onReject: (donationId: string, reason?: string) => Promise<void>;
  formatCurrency: (value?: number | null) => string;
  formatDate: (value?: string | null) => string;
  getPaymentMethodLabel: (method: unknown) => string;
  confirmerId: string;
}

const FundPendingDonationsManagerSection: React.FC<FundPendingDonationsManagerSectionProps> = ({
  pendingDonations,
  loading = false,
  confirming = false,
  rejecting = false,
  onRefresh,
  onConfirm,
  onReject,
  formatCurrency,
  formatDate,
  getPaymentMethodLabel,
}) => {
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedDonation, setSelectedDonation] = useState<MyPendingDonation | null>(null);
  const [confirmationNotes, setConfirmationNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  const handleConfirmClick = (donation: MyPendingDonation) => {
    setSelectedDonation(donation);
    setConfirmationNotes('');
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    if (!selectedDonation) return;

    setConfirmingId(selectedDonation.id);
    try {
      await onConfirm(selectedDonation.id, confirmationNotes.trim() || undefined);
      setShowConfirmModal(false);
      setSelectedDonation(null);
      setConfirmationNotes('');
    } catch (error) {
      console.error('Failed to confirm donation', error);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmModal(false);
    setSelectedDonation(null);
    setConfirmationNotes('');
  };

  const handleRejectClick = (donation: MyPendingDonation) => {
    setSelectedDonation(donation);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const handleRejectSubmit = async () => {
    if (!selectedDonation) return;

    setRejectingId(selectedDonation.id);
    try {
      await onReject(selectedDonation.id, rejectionReason.trim() || undefined);
      setShowRejectModal(false);
      setSelectedDonation(null);
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to reject donation', error);
    } finally {
      setRejectingId(null);
    }
  };

  const handleCancelReject = () => {
    setShowRejectModal(false);
    setSelectedDonation(null);
    setRejectionReason('');
  };

  // Normalize proofImages to always be an array
  const normalizeProofImages = (proofImages: string[] | string | null | undefined): string[] => {
    if (!proofImages) return [];
    if (Array.isArray(proofImages)) return proofImages;
    if (typeof proofImages === 'string') {
      // Handle comma-separated string
      if (proofImages.includes(',')) {
        return proofImages.split(',').map(url => url.trim()).filter(Boolean);
      }
      // Single URL string
      return [proofImages];
    }
    return [];
  };
  
  const proofImagesArray = normalizeProofImages(selectedDonation?.proofImages);
  const hasProofImages = proofImagesArray.length > 0;

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Đóng góp</h3>
            <p className="text-sm text-gray-500">Xác nhận các khoản đóng góp quỹ từ thành viên</p>
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

        <div className="flex-1 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
            </div>
          ) : pendingDonations.length === 0 ? (
            <EmptyState
              icon={<CheckCircle className="w-12 h-12 text-gray-300" />}
              title="Không có đóng góp đang chờ xác nhận"
              description="Tất cả các đóng góp quỹ đã được xác nhận."
            />
          ) : (
            <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-400px)] pr-2">
            {pendingDonations.map(item => (
              <div
                key={item.id}
                className="border border-amber-200 bg-amber-50 rounded-lg p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-amber-700 font-semibold uppercase tracking-wide">
                          {item.fundName || 'Quỹ chưa xác định'}
                        </p>
                        <h4 className="text-2xl font-bold text-gray-900 mt-1">
                          {formatCurrency(item.donationMoney)}
                        </h4>
                      </div>
                      {item.payOSOrderCode && (
                        <div className="text-xs text-gray-500 bg-white px-2 py-1 rounded border">
                          Mã đơn: {item.payOSOrderCode}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Người đóng góp:</span>
                        <span className="font-semibold text-gray-900 ml-2">
                          {item.donorName || 'Ẩn danh'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Phương thức:</span>
                        <span className="font-semibold text-gray-900 ml-2">
                          {getPaymentMethodLabel(item.paymentMethod)}
                        </span>
                      </div>
                      {item.paymentNotes && (
                        <div className="md:col-span-2">
                          <span className="text-gray-600">Ghi chú:</span>
                          <span className="text-gray-900 ml-2">{item.paymentNotes}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-gray-600">
                        <Clock className="w-4 h-4" />
                        <span>{formatDate(item.createdDate)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 lg:min-w-[200px]">
                    <button
                      type="button"
                      onClick={() => handleConfirmClick(item)}
                      disabled={confirming || confirmingId === item.id || rejectingId === item.id}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {confirmingId === item.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang xác nhận...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          Xác nhận
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRejectClick(item)}
                      disabled={confirming || confirmingId === item.id || rejecting || rejectingId === item.id}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                      {rejectingId === item.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Đang từ chối...
                        </>
                      ) : (
                        <>
                          <XCircle className="w-4 h-4" />
                          Từ chối
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ))}
            </div>
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      {showConfirmModal && selectedDonation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full my-8 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Xác nhận đóng góp</h3>
                  <p className="text-sm text-gray-500">Xác nhận khoản đóng góp này đã được nhận</p>
                </div>
              </div>
              <button
                onClick={handleCancelConfirm}
                className="text-sm font-semibold text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                type="button"
                disabled={confirmingId === selectedDonation.id}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Số tiền:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(selectedDonation.donationMoney)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Người đóng góp:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {selectedDonation.donorName || 'Ẩn danh'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Phương thức:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {getPaymentMethodLabel(selectedDonation.paymentMethod)}
                  </span>
                </div>
                {selectedDonation.paymentNotes && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Ghi chú:</span>
                    <p className="text-sm text-gray-900 mt-1">{selectedDonation.paymentNotes}</p>
                  </div>
                )}
              </div>

              {/* Proof Images Section - Display only, no upload */}
              {hasProofImages && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ảnh chứng từ đã upload:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {proofImagesArray.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Proof ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/50 transition-colors rounded-lg"
                        >
                          <Image className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    Ảnh chứng từ đã được người dùng upload. Vui lòng xem xét và xác nhận.
                  </p>
                </div>
              )}
              {!hasProofImages && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <p className="text-sm text-yellow-800">
                    <AlertTriangle className="w-4 h-4 inline mr-1" />
                    Chưa có ảnh chứng từ. Người dùng cần upload ảnh chứng từ trước khi bạn có thể xác nhận.
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ghi chú xác nhận (tùy chọn)
                </label>
                <textarea
                  value={confirmationNotes}
                  onChange={e => setConfirmationNotes(e.target.value)}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ví dụ: Đã xác nhận đóng góp tiền mặt, Đã xác nhận chuyển khoản qua VietQR..."
                  disabled={confirmingId === selectedDonation.id}
                />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={handleCancelConfirm}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                disabled={confirmingId === selectedDonation.id}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                disabled={confirmingId === selectedDonation.id || !hasProofImages}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                title={!hasProofImages ? 'Người dùng cần upload ảnh chứng từ trước khi bạn có thể xác nhận' : ''}
              >
                {confirmingId === selectedDonation.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang xác nhận...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Xác nhận
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedDonation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full my-8 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Từ chối đóng góp</h3>
                  <p className="text-sm text-gray-500">Từ chối khoản đóng góp này</p>
                </div>
              </div>
              <button
                onClick={handleCancelReject}
                className="text-sm font-semibold text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                type="button"
                disabled={rejectingId === selectedDonation.id}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Số tiền:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(selectedDonation.donationMoney)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Người đóng góp:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {selectedDonation.donorName || 'Ẩn danh'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Phương thức:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {getPaymentMethodLabel(selectedDonation.paymentMethod)}
                  </span>
                </div>
                {selectedDonation.paymentNotes && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Ghi chú:</span>
                    <p className="text-sm text-gray-900 mt-1">{selectedDonation.paymentNotes}</p>
                  </div>
                )}
              </div>

              {/* Proof Images Section - Display only */}
              {hasProofImages && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ảnh chứng từ đã upload:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {proofImagesArray.map((url, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={url}
                          alt={`Proof ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-gray-200"
                        />
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/50 transition-colors rounded-lg"
                        >
                          <Image className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Lý do từ chối <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={e => setRejectionReason(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="Vui lòng nhập lý do từ chối khoản đóng góp này..."
                  required
                  disabled={rejectingId === selectedDonation.id}
                />
                <p className="mt-1 text-xs text-gray-500">
                  Lý do từ chối sẽ được gửi đến người đóng góp
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={handleCancelReject}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                disabled={rejectingId === selectedDonation.id}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleRejectSubmit}
                disabled={rejectingId === selectedDonation.id || !rejectionReason.trim()}
                className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {rejectingId === selectedDonation.id ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang từ chối...
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    Từ chối
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FundPendingDonationsManagerSection;

