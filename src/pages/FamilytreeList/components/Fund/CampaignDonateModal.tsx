import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, Wallet, QrCode, Upload, Image as ImageIcon } from 'lucide-react';
import fundService from '@/services/fundService';
import { toast } from 'react-toastify';

type PaymentMethod = 'Cash' | 'VietQR';

interface CampaignDonateModalProps {
  isOpen: boolean;
  campaignId: string | null;
  memberId: string | null;
  donorName: string;
  onClose: () => void;
}

const CampaignDonateModal: React.FC<CampaignDonateModalProps> = ({
  isOpen,
  campaignId,
  memberId,
  donorName,
  onClose,
}) => {
  const [amount, setAmount] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [isAnonymous, setIsAnonymous] = useState<boolean>(false);
  const [method, setMethod] = useState<PaymentMethod>('Cash');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [donationId, setDonationId] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setAmount('');
      setNotes('');
      setIsAnonymous(false);
      setMethod('Cash');
      setSubmitting(false);
      setDonationId(null);
      setQrCodeUrl(null);
      setProofFiles([]);
      setUploading(false);
    }
  }, [isOpen]);

  const formattedAmount = useMemo(() => {
    const numeric = Number(amount.replace(/\D/g, ''));
    if (!Number.isFinite(numeric) || numeric <= 0) return '';
    return numeric.toLocaleString('vi-VN');
  }, [amount]);

  const handleChooseFiles = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    if (files.length) {
      setProofFiles(prev => [...prev, ...files]);
      // Reset input to allow re-selecting the same file
      e.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setProofFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateDonation = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!campaignId) {
      toast.error('Không xác định được chiến dịch.');
      return;
    }
    if (!memberId) {
      toast.error('Không xác định được thành viên.');
      return;
    }
    const numericAmount = Number(amount.replace(/\D/g, ''));
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      toast.error('Số tiền ủng hộ không hợp lệ.');
      return;
    }

    try {
      setSubmitting(true);
      const paymentMethod = method === 'Cash' ? 1 : 2; // 1: Cash, 2: BankTransfer (VietQR)
      const payload: any = {
        memberId,
        donorName: isAnonymous ? 'Ẩn danh' : donorName,
        amount: numericAmount,
        paymentMethod,
      };
      const trimmedNotes = notes.trim();
      if (trimmedNotes) {
        payload.paymentNotes = trimmedNotes;
      }
      const response = await fundService.createCampaignDonation(campaignId, payload);
      setDonationId(response.donationId);
      setQrCodeUrl(response.qrCodeUrl ?? null);

      if (method === 'Cash') {
        toast.success('Đã tạo yêu cầu ủng hộ. Vui lòng tải ảnh xác minh.');
      } else {
        toast.success('Đã tạo yêu cầu ủng hộ. Vui lòng quét VietQR để thanh toán.');
      }
    } catch (err: any) {
      console.error('Create campaign donation failed:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Không thể tạo yêu cầu ủng hộ.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUploadProof = async () => {
    if (!donationId) {
      toast.error('Chưa có mã giao dịch để tải xác minh.');
      return;
    }
    if (!proofFiles.length) {
      toast.error('Vui lòng chọn ít nhất một ảnh xác minh.');
      return;
    }
    try {
      setUploading(true);
      await fundService.uploadCampaignDonationProof(donationId, proofFiles);
      toast.success('Đã tải ảnh xác minh thành công.');
      onClose();
    } catch (err: any) {
      console.error('Upload campaign donation proof failed:', err);
      toast.error(err?.response?.data?.message || err?.message || 'Không thể tải ảnh xác minh.');
    } finally {
      setUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto justify-center items-center d-flex">
        <div className="sticky top-0 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5" />
            <h3 className="text-lg font-bold">Ủng hộ chiến dịch</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-lg transition-colors" type="button">
            <X className="w-5 h-5" />
          </button>
        </div>

        {!donationId && (
          <form onSubmit={handleCreateDonation} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Tên người ủng hộ</label>
              <input
                type="text"
                value={isAnonymous ? 'Ẩn danh' : donorName}
                readOnly={!isAnonymous}
                onChange={() => {}}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
              <label className="inline-flex items-center gap-2 text-sm text-gray-600 mt-2">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={e => setIsAnonymous(e.target.checked)}
                />
                Ẩn danh
              </label>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Số tiền (VND)</label>
              <input
                type="text"
                inputMode="numeric"
                value={formattedAmount}
                onChange={e => {
                  const digitsOnly = e.target.value.replace(/\D/g, '');
                  setAmount(digitsOnly);
                }}
                autoComplete="off"
                placeholder="Nhập số tiền"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Ghi chú</label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                placeholder="Ví dụ: Ủng hộ xây nhà thờ họ"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phương thức</label>
              <div className="flex items-center gap-4">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="method"
                    checked={method === 'Cash'}
                    onChange={() => setMethod('Cash')}
                  />
                  Tiền mặt
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="method"
                    checked={method === 'VietQR'}
                    onChange={() => setMethod('VietQR')}
                  />
                  VietQR
                </label>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60"
              >
                {submitting ? 'Đang tạo...' : 'Tạo yêu cầu ủng hộ'}
              </button>
            </div>
          </form>
        )}

        {donationId && method === 'VietQR' && (
          <div className="p-6 space-y-6">
            <div className="space-y-4 ">
              <div className="flex items-center gap-2 text-emerald-700 justify-center">
                <QrCode className="w-5 h-5" />
                <p className="font-semibold">Quét mã VietQR để hoàn tất thanh toán</p>
              </div>
              {qrCodeUrl ? (
                <img src={qrCodeUrl} alt="VietQR" className="w-full max-w-sm border rounded-lg mx-auto" />
              ) : (
                <p className="text-sm text-gray-600">Không tìm thấy QR Code. Vui lòng kiểm tra lại sau.</p>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-700">
                <Upload className="w-5 h-5" />
                <p className="font-semibold">Tải ảnh xác minh cho giao dịch VietQR</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {proofFiles.map((file, idx) => (
                  <div key={`${file.name}-${idx}`} className="flex items-center gap-2 border rounded px-2 py-1">
                    <ImageIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFilesSelected}
              />
                 <button
                  type="button"
                  onClick={handleChooseFiles}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  Chọn ảnh xác minh
                </button>
              <div className="flex items-center justify-end gap-2 border-t border-gray-200 mt-4 pt-4">
             


                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                >
                  Đóng
                </button>
                <button
                  type="button"
                  onClick={handleUploadProof}
                  disabled={uploading}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60"
                >
                  {uploading ? 'Đang tải...' : 'Tải ảnh xác minh'}
                </button>
              </div>
            </div>
          </div>
        )}

        {donationId && method === 'Cash' && (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-gray-700">
              <Upload className="w-5 h-5" />
              <p className="font-semibold">Tải ảnh xác minh cho giao dịch tiền mặt</p>
            </div>
            <div className="space-y-3">
              <div className="flex gap-2 flex-wrap">
                {proofFiles.map((file, idx) => (
                  <div key={`${file.name}-${idx}`} className="flex items-center gap-2 border rounded px-2 py-1">
                    <ImageIcon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm text-gray-700">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={handleFilesSelected}
              />
              <button
                type="button"
                onClick={handleChooseFiles}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Upload className="w-4 h-4" />
                Chọn ảnh xác minh
              </button>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleUploadProof}
                disabled={uploading}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60"
              >
                {uploading ? 'Đang tải...' : 'Tải ảnh xác minh'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CampaignDonateModal;


