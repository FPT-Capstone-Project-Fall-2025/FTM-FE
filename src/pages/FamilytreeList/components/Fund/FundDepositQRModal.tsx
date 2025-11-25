import React, { useEffect, useState } from 'react';
import { QrCode, Copy, Check, X, AlertCircle, Loader2 } from 'lucide-react';
import type { CreateFundDonationResponse } from '@/types/fund';

const numberFormatter = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
});

interface FundDepositQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  donationResponse: CreateFundDonationResponse | null;
  onCheckStatus?: () => void | Promise<void>;
  checkingStatus?: boolean;
}

const FundDepositQRModal: React.FC<FundDepositQRModalProps> = ({
  isOpen,
  onClose,
  donationResponse,
  onCheckStatus,
  checkingStatus = false,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setCopiedField(null);
    }
  }, [isOpen]);

  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const copyButton = (text: string, field: string) => (
    <button
      type="button"
      onClick={() => handleCopy(text, field)}
      className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
      title="Sao chép"
    >
      {copiedField === field ? (
        <Check className="w-4 h-4 text-green-600" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );

  if (!isOpen || !donationResponse) return null;

  const { qrCodeUrl, bankInfo, orderCode, donationId, message, requiresManualConfirmation } =
    donationResponse;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <QrCode className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Thông tin chuyển khoản</h3>
              <p className="text-sm text-gray-500">
                {requiresManualConfirmation
                  ? 'Vui lòng chuyển khoản và đợi quản trị viên xác nhận'
                  : 'Quét mã QR để chuyển khoản'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-sm font-semibold text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
            type="button"
            disabled={checkingStatus}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Message */}
          {message && (
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">{message}</p>
            </div>
          )}

          {/* QR Code */}
          {qrCodeUrl && (
            <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300">
              <div className="bg-white p-4 rounded-lg shadow-md">
                <img src={qrCodeUrl} alt="QR Code" className="w-64 h-64" />
              </div>
              <p className="text-sm text-gray-600 text-center">
                Mở ứng dụng ngân hàng và quét mã QR để chuyển khoản
              </p>
            </div>
          )}

          {/* Bank Information */}
          {bankInfo && (
            <div className="space-y-4">
              <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <span className="w-1 h-4 bg-blue-600 rounded-full"></span>
                Thông tin chuyển khoản
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Bank Name */}
                {bankInfo.bankName && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">Ngân hàng</label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <span className="flex-1 text-sm text-gray-900">{bankInfo.bankName}</span>
                    </div>
                  </div>
                )}

                {/* Account Number */}
                {bankInfo.accountNumber && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">
                      Số tài khoản
                    </label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <span className="flex-1 text-sm text-gray-900 font-mono">
                        {bankInfo.accountNumber}
                      </span>
                      {copyButton(bankInfo.accountNumber, 'accountNumber')}
                    </div>
                  </div>
                )}

                {/* Account Holder Name */}
                {bankInfo.accountHolderName && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">Chủ tài khoản</label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <span className="flex-1 text-sm text-gray-900">
                        {bankInfo.accountHolderName}
                      </span>
                      {copyButton(bankInfo.accountHolderName, 'accountHolderName')}
                    </div>
                  </div>
                )}

                {/* Amount */}
                {bankInfo.amount && (
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-gray-600">Số tiền</label>
                    <div className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <span className="flex-1 text-sm font-bold text-blue-900">
                        {numberFormatter.format(bankInfo.amount)}
                      </span>
                      {copyButton(String(bankInfo.amount), 'amount')}
                    </div>
                  </div>
                )}

                {/* Description */}
                {bankInfo.description && (
                  <div className="space-y-2 md:col-span-2">
                    <label className="text-sm font-semibold text-gray-600">Nội dung chuyển khoản</label>
                    <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <span className="flex-1 text-sm text-gray-900 font-mono">
                        {bankInfo.description}
                      </span>
                      {copyButton(bankInfo.description, 'description')}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Order Code */}
          {orderCode && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600">Mã đơn hàng</label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="flex-1 text-sm text-gray-900 font-mono">{orderCode}</span>
                {copyButton(orderCode, 'orderCode')}
              </div>
            </div>
          )}

          {/* Donation ID */}
          {donationId && (
            <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-600">Mã giao dịch</label>
              <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <span className="flex-1 text-sm text-gray-900 font-mono">{donationId}</span>
                {copyButton(donationId, 'donationId')}
              </div>
            </div>
          )}

          {/* Manual Confirmation Notice */}
          {requiresManualConfirmation && (
            <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900 mb-1">
                  Cần xác nhận thủ công
                </p>
                <p className="text-sm text-amber-800">
                  Sau khi chuyển khoản, vui lòng đợi quản trị viên xác nhận giao dịch. Bạn có thể
                  kiểm tra trạng thái trong phần "Đóng góp của tôi".
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between sticky bottom-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            disabled={checkingStatus}
          >
            Đóng
          </button>
          {onCheckStatus && (
            <button
              type="button"
              onClick={onCheckStatus}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              disabled={checkingStatus}
            >
              {checkingStatus ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang kiểm tra...
                </>
              ) : (
                'Kiểm tra trạng thái'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FundDepositQRModal;

