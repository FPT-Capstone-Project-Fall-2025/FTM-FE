import React, { useMemo } from 'react';
import { Megaphone, X } from 'lucide-react';
import bankList from '@/assets/fund/bank/json/bank.json';

export interface CampaignFormState {
  name: string;
  purpose: string;
  organizer: string;
  organizerContact: string;
  startDate: string;
  endDate: string;
  targetAmount: string;
  bankAccountNumber: string;
  bankName: string;
  bankCode: string;
  accountHolderName: string;
  notes: string;
  isPublic: boolean;
}

interface FundCampaignModalProps {
  isOpen: boolean;
  formState: CampaignFormState;
  onClose: () => void;
  onFormChange: (field: keyof CampaignFormState, value: string | boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  submitting?: boolean;
}

const FundCampaignModal: React.FC<FundCampaignModalProps> = ({
  isOpen,
  formState,
  onClose,
  onFormChange,
  onSubmit,
  submitting = false,
}) => {
  const banks = useMemo(
    () =>
      (bankList as Array<{
        bankCode: string;
        bankName: string;
        fullName?: string;
        bin?: string;
      }>).filter(bank => bank.bankCode && bank.bankName),
    []
  );

  const formattedTargetAmount = useMemo(() => {
    const digitsOnly = formState.targetAmount.replace(/\D/g, '');
    if (!digitsOnly) return '';
    return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }, [formState.targetAmount]);

  const handleTargetAmountChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    onFormChange('targetAmount', digits);
  };

  const handleBankSelect = (value: string) => {
    if (!value) {
      onFormChange('bankName', '');
      onFormChange('bankCode', '');
      return;
    }
    const selected = banks.find(bank => bank.bankCode === value);
    if (!selected) return;
    onFormChange('bankName', selected.bankName || '');
    onFormChange('bankCode', selected.bankCode || '');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Megaphone className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-gray-900">Tạo chiến dịch gây quỹ mới</h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" type="button">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={onSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tên chiến dịch <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formState.name}
                onChange={e => onFormChange('name', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ví dụ: Xây dựng nhà thờ họ"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Người tổ chức <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formState.organizer}
                onChange={e => onFormChange('organizer', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Họ tên người tổ chức"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Thông tin liên hệ</label>
            <input
              type="text"
              value={formState.organizerContact}
              onChange={e => onFormChange('organizerContact', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Điện thoại hoặc email liên hệ"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Mục tiêu chiến dịch <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formState.purpose}
              onChange={e => onFormChange('purpose', e.target.value)}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Mô tả mục tiêu, ý nghĩa và cách thức sử dụng quỹ"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Số tiền mục tiêu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={formattedTargetAmount}
                onChange={e => handleTargetAmountChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Nhập số tiền (VND)"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formState.startDate}
                onChange={e => onFormChange('startDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ngày kết thúc <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formState.endDate}
                onChange={e => onFormChange('endDate', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn ngân hàng</label>
                <select
                  value={formState.bankCode}
                  onChange={e => handleBankSelect(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Chọn nhanh ngân hàng --</option>
                  {banks.map(bank => (
                    <option key={bank.bankCode} value={bank.bankCode}>
                      {bank.bankName} ({bank.bankCode})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Số tài khoản nhận</label>
                <input
                  type="text"
                  value={formState.bankAccountNumber}
                  onChange={e => onFormChange('bankAccountNumber', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ví dụ: 0123456789"
                />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ngân hàng</label>
                <input
                  type="text"
                  value={formState.bankName}
                  onChange={e => onFormChange('bankName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tên ngân hàng"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mã ngân hàng</label>
                <input
                  type="text"
                  value={formState.bankCode}
                  onChange={e => onFormChange('bankCode', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ví dụ: VCB"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Chủ tài khoản</label>
                <input
                  type="text"
                  value={formState.accountHolderName}
                  onChange={e => onFormChange('accountHolderName', e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tên chủ tài khoản"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ghi chú</label>
            <textarea
              value={formState.notes}
              onChange={e => onFormChange('notes', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Thông tin bổ sung về chiến dịch"
            />
          </div>

          <div className="flex items-center gap-3">
            <input
              id="campaign-is-public"
              type="checkbox"
              checked={formState.isPublic}
              onChange={e => onFormChange('isPublic', e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="campaign-is-public" className="text-sm text-gray-600">
              Công khai chiến dịch cho các thành viên trong gia phả
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? 'Đang tạo...' : 'Tạo chiến dịch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FundCampaignModal;
