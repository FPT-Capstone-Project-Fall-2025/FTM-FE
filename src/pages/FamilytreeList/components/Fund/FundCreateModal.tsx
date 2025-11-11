import React, { useEffect, useMemo, useState } from 'react';
import { Wallet, Search } from 'lucide-react';

export interface BankInfo {
  bankCode: string;
  bankName: string;
  fullName?: string | undefined;
  bin?: string | undefined;
}

export interface FundCreateForm {
  fundName: string;
  description: string;
  bankAccountNumber: string;
  accountHolderName: string;
  bankCode: string;
  bankName: string;
}

interface FundCreateModalProps {
  isOpen: boolean;
  banks: BankInfo[];
  bankLogos: Record<string, string>;
  onClose: () => void;
  onSubmit: (form: FundCreateForm) => void;
  submitting?: boolean;
}

const initialForm: FundCreateForm = {
  fundName: '',
  description: '',
  bankAccountNumber: '',
  accountHolderName: '',
  bankCode: '',
  bankName: '',
};

const FundCreateModal: React.FC<FundCreateModalProps> = ({
  isOpen,
  banks,
  bankLogos,
  onClose,
  onSubmit,
  submitting = false,
}) => {
  const [form, setForm] = useState<FundCreateForm>(initialForm);
  const [bankSearch, setBankSearch] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof FundCreateForm, string>>>({});

  useEffect(() => {
    if (!isOpen) {
      setForm(initialForm);
      setBankSearch('');
      setErrors({});
    }
  }, [isOpen]);

  const filteredBanks = useMemo(() => {
    const keyword = bankSearch.trim().toLowerCase();
    if (!keyword) return banks;

    return banks.filter(bank => {
      return (
        bank.bankCode.toLowerCase().includes(keyword) ||
        bank.bankName.toLowerCase().includes(keyword) ||
        (bank.fullName?.toLowerCase().includes(keyword) ?? false)
      );
    });
  }, [banks, bankSearch]);

  const handleBankSelect = (bank: BankInfo) => {
    setForm(prev => ({
      ...prev,
      bankCode: bank.bankCode,
      bankName: bank.bankName,
    }));
    setErrors(prev => {
      const next = { ...prev };
      delete next.bankCode;
      delete next.bankName;
      return next;
    });
  };

  const handleInputChange = (field: keyof FundCreateForm, value: string) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      if (value.trim()) {
        delete next[field];
      }
      return next;
    });
  };

  const getBankLogo = (code: string) => {
    const key = code.toUpperCase();
    return bankLogos[key] || null;
  };

  const validateForm = (): boolean => {
    const nextErrors: Partial<Record<keyof FundCreateForm, string>> = {};
    if (!form.fundName.trim()) {
      nextErrors.fundName = 'Vui lòng nhập tên quỹ.';
    }
    if (!form.bankAccountNumber.trim()) {
      nextErrors.bankAccountNumber = 'Vui lòng nhập số tài khoản.';
    }
    if (!form.accountHolderName.trim()) {
      nextErrors.accountHolderName = 'Vui lòng nhập tên chủ tài khoản.';
    }
    if (!form.bankCode.trim() || !form.bankName.trim()) {
      nextErrors.bankCode = 'Vui lòng chọn ngân hàng.';
      nextErrors.bankName = 'Vui lòng chọn ngân hàng.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!validateForm()) return;

    const sanitizedForm: FundCreateForm = {
      fundName: form.fundName.trim(),
      description: form.description.trim(),
      bankAccountNumber: form.bankAccountNumber.trim(),
      accountHolderName: form.accountHolderName.trim(),
      bankCode: form.bankCode.trim(),
      bankName: form.bankName.trim(),
    };

    onSubmit(sanitizedForm);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Wallet className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">Tạo quỹ gia tộc</h3>
              <p className="text-sm text-gray-500">Mỗi gia phả chỉ có một quỹ</p>
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

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 divide-y lg:divide-y-0 lg:divide-x divide-gray-200">
          <div className="p-6 space-y-4 bg-white">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tên quỹ <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.fundName}
                onChange={e => handleInputChange('fundName', e.target.value)}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 ${
                  errors.fundName ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'
                }`}
                placeholder="Ví dụ: Quỹ gia tộc Nguyễn"
                required
              />
              {errors.fundName && <p className="mt-1 text-xs text-red-500">{errors.fundName}</p>}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Mô tả</label>
              <textarea
                value={form.description}
                onChange={e => handleInputChange('description', e.target.value)}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Mục đích và phạm vi sử dụng quỹ"
              />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Số tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.bankAccountNumber}
                  onChange={e => handleInputChange('bankAccountNumber', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 ${
                    errors.bankAccountNumber
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Nhập số tài khoản"
                  required
                />
                {errors.bankAccountNumber && <p className="mt-1 text-xs text-red-500">{errors.bankAccountNumber}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Chủ tài khoản <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.accountHolderName}
                  onChange={e => handleInputChange('accountHolderName', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 ${
                    errors.accountHolderName
                      ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                      : 'border-gray-300'
                  }`}
                  placeholder="Tên chủ tài khoản"
                  required
                />
                {errors.accountHolderName && (
                  <p className="mt-1 text-xs text-red-500">{errors.accountHolderName}</p>
                )}
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4 bg-gray-50">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ngân hàng <span className="text-red-500">*</span>
              </label>
              {errors.bankCode && (
                <p className="mb-2 text-xs text-red-500">Vui lòng chọn ngân hàng từ danh sách bên dưới.</p>
              )}
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={bankSearch}
                  onChange={e => setBankSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Tìm kiếm ngân hàng"
                />
              </div>

              <div className="h-72 overflow-y-auto pr-1">
                <div className="space-y-2">
                  {filteredBanks.map(bank => {
                    const isSelected = form.bankCode === bank.bankCode;
                    const logo = getBankLogo(bank.bankCode);
                    return (
                      <button
                        key={bank.bankCode}
                        type="button"
                        onClick={() => handleBankSelect(bank)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
                          isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
                          {logo ? (
                            <img src={logo} alt={bank.bankName} className="w-full h-full object-contain" />
                          ) : (
                            <span className="text-sm font-semibold text-gray-500">
                              {bank.bankCode.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-semibold text-gray-900">{bank.bankName}</p>
                          <p className="text-xs text-gray-500 line-clamp-1">{bank.fullName}</p>
                        </div>
                        <div className="ml-auto text-xs text-gray-400 uppercase">{bank.bankCode}</div>
                      </button>
                    );
                  })}

                  {filteredBanks.length === 0 && (
                    <p className="text-sm text-gray-500 text-center py-6">Không tìm thấy ngân hàng phù hợp</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-1 lg:col-span-2 px-6 py-4 bg-white border-t border-gray-200 flex justify-end gap-3">
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
              {submitting ? 'Đang tạo...' : 'Tạo quỹ'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FundCreateModal;
