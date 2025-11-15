import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import FundWithdrawalSection, {
  type WithdrawalFormState,
} from './FundWithdrawalSection';
import type { FundCampaign } from '@/types/fund';

interface FundWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  hasFund: boolean;
  computedBalance: number;
  campaigns: FundCampaign[];
  formState: WithdrawalFormState;
  onFormChange: (field: keyof WithdrawalFormState, value: string | File[]) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  actionLoading?: boolean;
  formatCurrency: (value?: number | null) => string;
}

const FundWithdrawalModal: React.FC<FundWithdrawalModalProps> = ({
  isOpen,
  onClose,
  hasFund,
  computedBalance,
  campaigns,
  formState,
  onFormChange,
  onSubmit,
  actionLoading = false,
  formatCurrency,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFormSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(event);
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Tạo yêu cầu rút tiền
            </h3>
            <p className="text-sm text-gray-500">
              Điền thông tin để tạo yêu cầu rút tiền từ quỹ
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
            type="button"
            disabled={actionLoading}
            aria-label="Đóng"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <FundWithdrawalSection
            hasFund={hasFund}
            computedBalance={computedBalance}
            campaigns={campaigns}
            formState={formState}
            onFormChange={onFormChange}
            onSubmit={handleFormSubmit}
            actionLoading={actionLoading}
            formatCurrency={formatCurrency}
          />
        </div>
      </div>
    </div>
  );
};

export default FundWithdrawalModal;

