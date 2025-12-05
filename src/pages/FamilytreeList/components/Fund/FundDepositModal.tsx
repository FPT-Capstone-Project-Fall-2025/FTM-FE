import React, { useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import { Select } from 'antd';
import familyTreeService from '@/services/familyTreeService';

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
  donorMemberId?: string;
  donorName?: string;
}

interface MemberOption {
  id: string;
  name: string;
}

interface FundDepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (form: FundDepositForm) => void | Promise<void>;
  submitting?: boolean;
  ftId?: string | null;
  currentMemberId?: string | null;
  currentMemberName?: string | null;
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
  ftId,
  currentMemberId,
  currentMemberName,
}) => {
  const [form, setForm] = useState<FundDepositForm>(defaultForm);
  const [amountInput, setAmountInput] = useState('');
  const [isDepositForRelative, setIsDepositForRelative] = useState(false);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Fetch members from API when switch is ON
  useEffect(() => {
    if (isOpen && isDepositForRelative && ftId) {
      const fetchMembers = async () => {
        setMembersLoading(true);
        try {
          const res: any = await familyTreeService.getMemberTree(ftId);
          const datalist = res?.data?.datalist || [];
          const memberOptions: MemberOption[] = datalist
            .map((item: any) => ({
              id: item.value.id,
              name: item.value.name,
            }))
            // Filter out current user from the list
            .filter((member: MemberOption) => member.id !== currentMemberId);
          setMembers(memberOptions);
        } catch (error) {
          console.error('Error fetching members:', error);
          setMembers([]);
        } finally {
          setMembersLoading(false);
        }
      };
      fetchMembers();
    } else {
      setMembers([]);
    }
  }, [isOpen, isDepositForRelative, ftId, currentMemberId]);

  // Reset form and states when modal closes
  useEffect(() => {
    if (!isOpen) {
      setForm(defaultForm);
      setAmountInput('');
      setIsDepositForRelative(false);
      setSelectedMemberId(null);
      setMembers([]);
    }
  }, [isOpen]);

  // Auto-set current member when switch is OFF and modal is open
  useEffect(() => {
    if (isOpen && !isDepositForRelative) {
      // Always set current member info when switch is OFF
      if (currentMemberId && currentMemberName) {
        setSelectedMemberId(currentMemberId);
        setForm(prev => ({
          ...prev,
          donorMemberId: currentMemberId,
          donorName: currentMemberName,
        }));
      }
    } else if (isOpen && isDepositForRelative) {
      // When switching to relative mode, clear the auto-set values
      setSelectedMemberId(null);
    }
  }, [isOpen, isDepositForRelative, currentMemberId, currentMemberName]);

  // Handle member selection change
  const handleMemberChange = (value: string) => {
    setSelectedMemberId(value);
    const selectedMember = members.find(m => m.id === value);
    if (selectedMember) {
      setForm(prev => ({
        ...prev,
        donorMemberId: selectedMember.id,
        donorName: selectedMember.name,
      }));
    }
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const amountValue = parseAmountInput(amountInput);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      return;
    }
    
    // Validation: If depositing for relative, must select a member
    if (isDepositForRelative && !selectedMemberId) {
      alert('Vui lòng chọn người đóng góp.');
      return;
    }
    
    const payload: FundDepositForm = {
      amount: amountValue,
      paymentMethod: form.paymentMethod,
    };
    
    // When depositing for relative, use selected member's ID and name
    if (isDepositForRelative && form.donorMemberId && form.donorName) {
      payload.donorMemberId = form.donorMemberId;
      payload.donorName = form.donorName;
    } else if (!isDepositForRelative && form.donorMemberId && form.donorName) {
      // When not depositing for relative, use current user's info
      payload.donorMemberId = form.donorMemberId;
      payload.donorName = form.donorName;
    }
    
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
            {/* Switch toggle for depositing on behalf of relative */}
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg bg-gray-50">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDepositForRelative}
                  onChange={(e) => setIsDepositForRelative(e.target.checked)}
                  className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-semibold text-gray-700">
                  Nộp tiền hộ cho người thân
                </span>
              </label>
            </div>

            {/* Donor selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Người đóng góp <span className="text-red-500">*</span>
              </label>
              {isDepositForRelative ? (
                <Select
                  size="large"
                  style={{ width: '100%' }}
                  placeholder="Chọn người đóng góp"
                  getPopupContainer={(trigger) => trigger.parentElement || document.body}
                  showSearch
                  loading={membersLoading}
                  value={selectedMemberId}
                  onChange={handleMemberChange}
                  filterOption={(input, option) =>
                    (option?.label?.toString() || '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={members
                    .filter(member => member.id !== currentMemberId) // Double check: filter out current user
                    .map(member => ({
                      label: member.name,
                      value: member.id,
                    }))}
                />
              ) : (
                <input
                  type="text"
                  value={form.donorName || currentMemberName || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-700 cursor-not-allowed"
                />
              )}
            </div>
          </div>
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
