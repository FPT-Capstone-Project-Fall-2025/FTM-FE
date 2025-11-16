import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, RefreshCw, AlertTriangle, Upload, X } from 'lucide-react';
import type { FundCampaign } from '@/types/fund';
import { EmptyState } from './FundLoadingEmpty';

const numberFormatter = new Intl.NumberFormat('vi-VN');

const formatAmountInput = (raw: string) => {
  const digitsOnly = raw.replace(/\D/g, '');
  if (!digitsOnly) return '';
  const value = Number(digitsOnly);
  if (!Number.isFinite(value) || value === 0) return '';
  return numberFormatter.format(value);
};

const parseAmountInput = (formatted: string) => {
  const digitsOnly = formatted.replace(/\D/g, '');
  if (!digitsOnly) return 0;
  const value = Number(digitsOnly);
  return Number.isFinite(value) ? value : 0;
};

export interface WithdrawalFormState {
  amount: string;
  reason: string;
  recipient: string;
  relatedEvent: string;
  date: string;
  campaignId: string;
  receiptImages: File[];
}

interface FundWithdrawalSectionProps {
  hasFund: boolean;
  computedBalance: number;
  campaigns: FundCampaign[];
  formState: WithdrawalFormState;
  onFormChange: (field: keyof WithdrawalFormState, value: string | File[]) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  actionLoading?: boolean;
  formatCurrency: (value?: number | null) => string;
}

const FundWithdrawalSection: React.FC<FundWithdrawalSectionProps> = ({
  hasFund,
  computedBalance,
  campaigns,
  formState,
  onFormChange,
  onSubmit,
  actionLoading = false,
  formatCurrency,
}) => {
  const [amountInput, setAmountInput] = useState('');
  const [amountError, setAmountError] = useState<string | null>(null);
  const [receiptImagePreviews, setReceiptImagePreviews] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset amountInput when form is cleared externally
  useEffect(() => {
    if (!formState.amount && amountInput) {
      setAmountInput('');
      setAmountError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState.amount]);

  // Sync previews with formState.receiptImages when form is reset externally
  useEffect(() => {
    const imagesCount = Array.isArray(formState.receiptImages) ? formState.receiptImages.length : 0;
    const previewsCount = receiptImagePreviews.length;
    
    // If formState has fewer images than previews, clear excess previews
    if (imagesCount < previewsCount) {
      setReceiptImagePreviews(prev => prev.slice(0, imagesCount));
    }
    // If formState is empty, clear all previews
    if (imagesCount === 0 && previewsCount > 0) {
      setReceiptImagePreviews([]);
    }
  }, [formState.receiptImages, receiptImagePreviews.length]);

  const handleReceiptImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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
      // Some files were invalid
      return;
    }

    // Add to existing images - ensure receiptImages is an array
    const existingImages = Array.isArray(formState.receiptImages) ? formState.receiptImages : [];
    const newImages = [...existingImages, ...validFiles];
    onFormChange('receiptImages', newImages);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setReceiptImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset file input to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveReceiptImage = (index: number) => {
    const existingImages = Array.isArray(formState.receiptImages) ? formState.receiptImages : [];
    const newImages = existingImages.filter((_, i) => i !== index);
    onFormChange('receiptImages', newImages);
    setReceiptImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleAmountChange = (value: string) => {
    const formatted = formatAmountInput(value);
    setAmountInput(formatted);
    
    // Update form state with raw number (for submission)
    const parsed = parseAmountInput(formatted);
    onFormChange('amount', parsed > 0 ? String(parsed) : '');

    // Validate against balance
    if (parsed > 0) {
      if (parsed > computedBalance) {
        setAmountError(`Số tiền không được vượt quá số dư hiện tại (${formatCurrency(computedBalance)})`);
      } else {
        setAmountError(null);
      }
    } else {
      setAmountError(null);
    }
  };

  if (!hasFund) {
    return (
      <EmptyState
        icon={<AlertCircle className="w-12 h-12 text-gray-400" />}
        title="Không thể tạo yêu cầu"
        description="Hiện tại chưa có quỹ để rút tiền."
      />
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <span className="inline-flex items-center gap-2 text-sm text-gray-500">
          <RefreshCw className="w-4 h-4" />
          Số dư khả dụng: <span className="font-semibold text-gray-900">{formatCurrency(computedBalance)}</span>
        </span>
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Số tiền <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={amountInput}
            onChange={e => handleAmountChange(e.target.value)}
            className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
              amountError ? 'border-red-300 bg-red-50' : 'border-gray-300'
            }`}
            placeholder="Ví dụ: 1.000.000"
            required
          />
          {amountError && (
            <div className="mt-2 flex items-start gap-2 text-sm text-red-600">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{amountError}</span>
            </div>
          )}
          <p className="mt-1 text-xs text-gray-500">
            Số dư hiện tại: <span className="font-semibold">{formatCurrency(computedBalance)}</span>
          </p>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Nội dung chi tiêu <span className="text-red-500">*</span>
          </label>
          <textarea
            value={formState.reason}
            onChange={e => onFormChange('reason', e.target.value)}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Mô tả chi tiết lý do chi tiêu"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Người nhận <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formState.recipient}
              onChange={e => onFormChange('recipient', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tên người nhận"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Ảnh hóa đơn/chứng từ <span className="text-red-500">*</span>
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/jpg,image/png,image/gif"
            multiple
            onChange={handleReceiptImageSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors flex items-center justify-center gap-2 text-gray-600"
          >
            <Upload className="w-5 h-5" />
            <span>Chọn ảnh hóa đơn/chứng từ</span>
          </button>
          {Array.isArray(formState.receiptImages) && formState.receiptImages.length > 0 && (
            <div className="mt-3 grid grid-cols-2 gap-2">
              {receiptImagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-32 object-cover rounded-lg border border-gray-300"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveReceiptImage(index)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-gray-500">
            {(!Array.isArray(formState.receiptImages) || formState.receiptImages.length === 0) && 'Ảnh hóa đơn/chứng từ là bắt buộc'}
            {Array.isArray(formState.receiptImages) && formState.receiptImages.length > 0 && `Đã chọn ${formState.receiptImages.length} ảnh`}
          </p>
        </div>

        <button
          type="submit"
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={actionLoading || !!amountError || !amountInput || !Array.isArray(formState.receiptImages) || formState.receiptImages.length === 0}
        >
          {actionLoading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
        </button>
      </form>
    </div>
  );
};

export default FundWithdrawalSection;
