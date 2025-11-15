import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, AlertTriangle } from 'lucide-react';
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
}

interface FundWithdrawalSectionProps {
  hasFund: boolean;
  computedBalance: number;
  campaigns: FundCampaign[];
  formState: WithdrawalFormState;
  onFormChange: (field: keyof WithdrawalFormState, value: string) => void;
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

  // Reset amountInput when form is cleared externally
  useEffect(() => {
    if (!formState.amount && amountInput) {
      setAmountInput('');
      setAmountError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formState.amount]);

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
        <h3 className="text-2xl font-bold text-gray-900">Tạo yêu cầu rút tiền</h3>
        <span className="inline-flex items-center gap-2 text-sm text-gray-500">
          <RefreshCw className="w-4 h-4" />
          Số dư: <span className="font-semibold text-gray-900">{formatCurrency(computedBalance)}</span>
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
            Lý do chi tiêu <span className="text-red-500">*</span>
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
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Chiến dịch liên quan</label>
            <select
              value={formState.campaignId}
              onChange={e => onFormChange('campaignId', e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Không liên kết</option>
              {campaigns.map(campaign => (
                <option key={campaign.id} value={campaign.id}>
                  {campaign.campaignName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">Sự kiện liên quan</label>
          <input
            type="text"
            value={formState.relatedEvent}
            onChange={e => onFormChange('relatedEvent', e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Tên sự kiện (nếu có)"
          />
        </div>

        <button
          type="submit"
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          disabled={actionLoading || !!amountError || !amountInput}
        >
          {actionLoading ? 'Đang xử lý...' : 'Gửi yêu cầu'}
        </button>
      </form>
    </div>
  );
};

export default FundWithdrawalSection;
