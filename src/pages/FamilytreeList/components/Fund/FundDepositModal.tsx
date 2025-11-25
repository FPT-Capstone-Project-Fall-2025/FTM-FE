import React, { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';

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

export interface FundDepositForm {
  amount: number;
  paymentMethod: 'Cash' | 'BankTransfer';
  paymentNotes?: string;
}

interface FundDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: FundDepositForm) => void | Promise<void>;
  submitting?: boolean;
}

const defaultForm: FundDepositForm = {
  amount: 0,
  paymentMethod: 'Cash',
  paymentNotes: '',
};

const FundDepositModal: React.FC<FundDepositModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  submitting = false,
}) => {
  const [form, setForm] = useState<FundDepositForm>(defaultForm);
  const [amountInput, setAmountInput] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setForm(defaultForm);
      setAmountInput('');
    }
  }, [isOpen]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amountValue = parseAmountInput(amountInput);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      return;
    }
    const payload: FundDepositForm = {
      amount: amountValue,
      paymentMethod: form.paymentMethod,
    };
    const note = form.paymentNotes?.trim();
    if (note) {
      payload.paymentNotes = note;
    }
    onSubmit(payload);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Đóng góp quỹ</h3>
              <p className="text-sm text-gray-500">Thông tin đóng góp sẽ được ghi nhận ngay sau khi xác nhận</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-sm font-semibold text-gray-500 hover:text-gray-700"
            type="button"
            disabled={submitting}
          >
            Đóng
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Số tiền đóng góp <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={amountInput}
                onChange={e => {
                  const formatted = formatAmountInput(e.target.value);
                  setAmountInput(formatted);
                }}
                min={0}
                step={1000}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Ví dụ: 3.000.000"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Phương thức thanh toán</label>
              <div className="space-y-2">
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="Cash"
                    checked={form.paymentMethod === 'Cash'}
                    onChange={() => setForm(prev => ({ ...prev, paymentMethod: 'Cash' }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Tiền mặt</span>
                </label>
                <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-blue-300 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="BankTransfer"
                    checked={form.paymentMethod === 'BankTransfer'}
                    onChange={() => setForm(prev => ({ ...prev, paymentMethod: 'BankTransfer' }))}
                    className="text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Chuyển khoản</span>
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ghi chú</label>
              <textarea
                value={form.paymentNotes ?? ''}
                onChange={e => setForm(prev => ({ ...prev, paymentNotes: e.target.value }))}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Thông tin thêm về giao dịch"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
              disabled={submitting}
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              disabled={submitting}
            >
              {submitting ? 'Đang xử lý...' : 'Xác nhận đóng góp tiền'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FundDepositModal;
