import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle, XCircle, Loader2, Upload, X } from 'lucide-react';
import type { FundExpense } from '@/types/fund';

interface FundApprovalModalProps {
  isOpen: boolean;
  action: 'approve' | 'reject' | null;
  expense: FundExpense | null;
  note: string;
  onNoteChange: (value: string) => void;
  paymentProofImages: File[];
  onPaymentProofImagesChange: (files: File[]) => void;
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
  paymentProofImages,
  onPaymentProofImagesChange,
  onCancel,
  onConfirm,
  submitting = false,
  formatCurrency,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

  // Update previews when paymentProofImages change
  useEffect(() => {
    if (paymentProofImages.length === 0) {
      setImagePreviews([]);
      return;
    }

    const loadPreviews = async () => {
      const previewPromises = paymentProofImages.map(file => {
        return new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            resolve(e.target?.result as string);
          };
          reader.onerror = () => {
            resolve('');
          };
          reader.readAsDataURL(file);
        });
      });

      const previews = await Promise.all(previewPromises);
      setImagePreviews(previews.filter(Boolean));
    };

    loadPreviews();
  }, [paymentProofImages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Validate file types
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    const validFiles = files.filter(file => {
      if (!validTypes.includes(file.type)) {
        return false;
      }
      // Validate file size (max 10MB per file)
      if (file.size > 10 * 1024 * 1024) {
        return false;
      }
      return true;
    });

    if (validFiles.length !== files.length) {
      return;
    }

    // Add to existing images
    const newImages = [...paymentProofImages, ...validFiles];
    onPaymentProofImagesChange(newImages);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveImage = (index: number) => {
    const newImages = paymentProofImages.filter((_, i) => i !== index);
    onPaymentProofImagesChange(newImages);
  };

  if (!isOpen || !expense || !action) return null;

  const isApprove = action === 'approve';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
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

      {/* Payment Proof Images - Only for approve action */}
      {isApprove && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Ảnh chứng từ thanh toán (tuỳ chọn)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors flex items-center justify-center gap-2 text-gray-600"
            disabled={submitting}
          >
            <Upload className="w-5 h-5" />
            <span>Chọn ảnh chứng từ thanh toán</span>
          </button>
          {paymentProofImages.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Chứng từ ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    disabled={submitting}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {paymentProofImages.length > 0 && (
            <p className="mt-2 text-xs text-gray-500">
              Đã chọn {paymentProofImages.length} ảnh
            </p>
          )}
        </div>
      )}

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
