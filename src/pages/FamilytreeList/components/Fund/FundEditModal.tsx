import React, { useEffect, useMemo, useState } from 'react';
import { Wallet, Search, X, ChevronDown } from 'lucide-react';
import type { Fund } from '@/types/fund';
import type { BankInfo } from './FundCreateModal';
import familyTreeService from '@/services/familyTreeService';
import bankList from '@/assets/fund/bank/json/bank.json';

// Import bank logo images
import VCB from '@/assets/fund/bank/images/VCB.png';
import CTG from '@/assets/fund/bank/images/CTG.png';
import TCB from '@/assets/fund/bank/images/TCB.png';
import BIDV from '@/assets/fund/bank/images/BIDV.png';
import VARB from '@/assets/fund/bank/images/VARB.png';
import NVB from '@/assets/fund/bank/images/NVB.png';
import STB from '@/assets/fund/bank/images/STB.png';
import ACB from '@/assets/fund/bank/images/ACB.png';
import MB from '@/assets/fund/bank/images/MB.png';
import TPB from '@/assets/fund/bank/images/TPB.png';
import SVB from '@/assets/fund/bank/images/SVB.png';
import VIB from '@/assets/fund/bank/images/VIB.png';
import VPB from '@/assets/fund/bank/images/VPB.png';
import SHB from '@/assets/fund/bank/images/SHB.png';
import EIB from '@/assets/fund/bank/images/EIB.png';
import BVB from '@/assets/fund/bank/images/BVB.png';
import VCCB from '@/assets/fund/bank/images/VCCB.png';
import SCB from '@/assets/fund/bank/images/SCB.png';
import VRB from '@/assets/fund/bank/images/VRB.png';
import ABB from '@/assets/fund/bank/images/ABB.png';
import PVCB from '@/assets/fund/bank/images/PVCB.png';
import NAB from '@/assets/fund/bank/images/NAB.png';
import HDB from '@/assets/fund/bank/images/HDB.png';
import VB from '@/assets/fund/bank/images/VB.png';
import CFC from '@/assets/fund/bank/images/CFC.png';
import PBVN from '@/assets/fund/bank/images/PBVN.png';
import PGB from '@/assets/fund/bank/images/PGB.png';
import IVB from '@/assets/fund/bank/images/IVB.png';
import GPB from '@/assets/fund/bank/images/GPB.png';
import NASB from '@/assets/fund/bank/images/NASB.png';
import VAB from '@/assets/fund/bank/images/VAB.png';
import SGB from '@/assets/fund/bank/images/SGB.png';
import MSB from '@/assets/fund/bank/images/MSB.png';
import LPB from '@/assets/fund/bank/images/LPB.png';
import KLB from '@/assets/fund/bank/images/KLB.png';
import WOO from '@/assets/fund/bank/images/WOO.png';
import UOB from '@/assets/fund/bank/images/UOB.png';
import OCB from '@/assets/fund/bank/images/OCB.png';
import Seab from '@/assets/fund/bank/images/Seab.png';
import KebHana from '@/assets/fund/bank/images/KebHana.png';
import Mirae from '@/assets/fund/bank/images/Mirae.png';

export interface FundEditForm {
  fundName: string;
  description: string;
  bankAccountNumber: string;
  accountHolderName: string;
  bankCode: string;
  bankName: string;
  fundManagers: string;
}

interface MemberOption {
  id: string;
  name: string;
}

interface FundEditModalProps {
  isOpen: boolean;
  fund: Fund | null;
  ftId: string | null;
  bankLogos?: Record<string, string>;
  onClose: () => void;
  onSubmit: (form: FundEditForm) => void;
  submitting?: boolean;
}

const FundEditModal: React.FC<FundEditModalProps> = ({
  isOpen,
  fund,
  ftId,
  bankLogos = {},
  onClose,
  onSubmit,
  submitting = false,
}) => {
  // Bank logo mapping: bankCode (from bank.json) -> imported image
  const bankLogoMap: Record<string, string> = useMemo(
    () => ({
      VCB,
      CTG,
      TCB,
      BIDV,
      VARB,
      NVB,
      STB,
      ACB,
      MB,
      TPB,
      SVB,
      VIB,
      VPB,
      SHB,
      EIB,
      BVB,
      VCCB,
      SCB,
      VRB,
      ABB,
      PVCB,
      NAB,
      HDB,
      VB,
      CFC,
      PBVN,
      PGB,
      IVB,
      GPB,
      NASB,
      VAB,
      SGB,
      MSB,
      LPB,
      KLB,
      WOO,
      UOB,
      OCB,
      SEAB: Seab,
      KEBHANAHCM: KebHana,
      KEBHANAHN: KebHana,
      MAFC: Mirae,
      WOORI: WOO,
      SHINHAN: SVB,
      PUBLICBANK: PBVN,
      STANDARDCHARTERED: WOO, // Use WOO as placeholder, can be updated if needed
      STANDARD: WOO, // Use WOO as placeholder
    }),
    []
  );

  // Load banks from bank.json
  const banks = useMemo(
    () =>
      (bankList as Array<{
        bankCode: string;
        bankName: string;
        fullName?: string;
        bin?: string;
      }>)
        .filter(bank => bank.bankCode && bank.bankName)
        .map(bank => ({
          bankCode: bank.bin || bank.bankCode, // Use bin as bankCode (API format), fallback to bankCode
          bankName: bank.bankName,
          fullName: bank.fullName,
          originalBankCode: bank.bankCode, // Keep original bankCode for logo mapping
        })),
    []
  );
  const [form, setForm] = useState<FundEditForm>({
    fundName: '',
    description: '',
    bankAccountNumber: '',
    accountHolderName: '',
    bankCode: '',
    bankName: '',
    fundManagers: '',
  });
  const [bankSearch, setBankSearch] = useState('');
  const [errors, setErrors] = useState<Partial<Record<keyof FundEditForm, string>>>({});
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);

  // Load members when modal opens
  useEffect(() => {
    if (isOpen && ftId) {
      const loadMembers = async () => {
        setMembersLoading(true);
        try {
          const res: any = await familyTreeService.getMemberTree(ftId);
          const datalist = res?.data?.datalist || [];
          const memberOptions: MemberOption[] = datalist.map((item: any) => ({
            id: item.value.id,
            name: item.value.name || 'Không có tên',
          }));
          setMembers(memberOptions);
        } catch (error) {
          console.error('Error loading members:', error);
          setMembers([]);
        } finally {
          setMembersLoading(false);
        }
      };
      loadMembers();
    }
  }, [isOpen, ftId]);

  useEffect(() => {
    if (isOpen && fund) {
      // Parse fundManagers if it's a comma-separated string of IDs
      const managerIds = fund.fundManagers
        ? fund.fundManagers.split(',').map((id: string) => id.trim()).filter(Boolean)
        : [];
      setSelectedMemberIds(managerIds);
      
      setForm({
        fundName: fund.fundName || '',
        description: fund.description || '',
        bankAccountNumber: fund.bankAccountNumber || '',
        accountHolderName: fund.accountHolderName || '',
        bankCode: fund.bankCode || '',
        bankName: fund.bankName || '',
        fundManagers: managerIds.join(','), // Store as comma-separated IDs
      });
      setBankSearch('');
      setMemberSearch('');
      setErrors({});
    } else if (!isOpen) {
      setSelectedMemberIds([]);
      setMemberSearch('');
      setShowMemberDropdown(false);
    }
  }, [isOpen, fund]);

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

  const filteredMembers = useMemo(() => {
    const keyword = memberSearch.trim().toLowerCase();
    if (!keyword) return members;

    return members.filter(member =>
      member.name.toLowerCase().includes(keyword)
    );
  }, [members, memberSearch]);

  const selectedMembers = useMemo(() => {
    return members.filter(m => selectedMemberIds.includes(m.id));
  }, [members, selectedMemberIds]);

  const handleMemberToggle = (memberId: string) => {
    setSelectedMemberIds(prev => {
      const newIds = prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId];
      
      // Update form with comma-separated IDs
      setForm(prev => ({
        ...prev,
        fundManagers: newIds.join(','),
      }));
      
      return newIds;
    });
  };

  const handleRemoveMember = (memberId: string) => {
    setSelectedMemberIds(prev => {
      const newIds = prev.filter(id => id !== memberId);
      setForm(prev => ({
        ...prev,
        fundManagers: newIds.join(','),
      }));
      return newIds;
    });
  };

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

  const handleInputChange = (field: keyof FundEditForm, value: string) => {
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

  const getBankLogo = (code: string, originalBankCode?: string) => {
    // First try to get from local images using originalBankCode
    if (originalBankCode) {
      const logo = bankLogoMap[originalBankCode.toUpperCase()];
      if (logo) return logo;
    }
    
    // Fallback to bankLogos prop (for backward compatibility)
    const key = code.toUpperCase();
    return bankLogos[key] || null;
  };

  const validateForm = (): boolean => {
    const nextErrors: Partial<Record<keyof FundEditForm, string>> = {};
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

    const sanitizedForm: FundEditForm = {
      fundName: form.fundName.trim(),
      description: form.description.trim(),
      bankAccountNumber: form.bankAccountNumber.trim(),
      accountHolderName: form.accountHolderName.trim(),
      bankCode: form.bankCode.trim(),
      bankName: form.bankName.trim(),
      fundManagers: selectedMemberIds.join(','), // Ensure we use the latest selected IDs
    };

    onSubmit(sanitizedForm);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-member-dropdown]')) {
        setShowMemberDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

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
              <h3 className="text-lg font-bold text-gray-900">Chỉnh sửa thông tin quỹ</h3>
              <p className="text-sm text-gray-500">Cập nhật thông tin quỹ gia tộc</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
            type="button"
            disabled={submitting}
            aria-label="Đóng"
          >
            <X className="w-6 h-6" />
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

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Người quản lý quỹ
              </label>
              
              {/* Selected members display */}
              {selectedMembers.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {selectedMembers.map(member => (
                    <span
                      key={member.id}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-lg text-sm"
                    >
                      {member.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member.id)}
                        className="hover:text-blue-600"
                        aria-label={`Xóa ${member.name}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Member selector */}
              <div className="relative" data-member-dropdown>
                <button
                  type="button"
                  onClick={() => setShowMemberDropdown(!showMemberDropdown)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 flex items-center justify-between bg-white"
                  disabled={membersLoading}
                >
                  <span className="text-gray-500">
                    {membersLoading ? 'Đang tải...' : 'Chọn người quản lý quỹ'}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showMemberDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showMemberDropdown && !membersLoading && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
                    <div className="p-2 border-b border-gray-200">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={memberSearch}
                          onChange={e => setMemberSearch(e.target.value)}
                          onClick={e => e.stopPropagation()}
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                          placeholder="Tìm kiếm thành viên..."
                        />
                      </div>
                    </div>
                    <div className="max-h-48 overflow-y-auto">
                      {filteredMembers.length === 0 ? (
                        <p className="p-4 text-sm text-gray-500 text-center">
                          {memberSearch ? 'Không tìm thấy thành viên' : 'Không có thành viên'}
                        </p>
                      ) : (
                        filteredMembers.map(member => {
                          const isSelected = selectedMemberIds.includes(member.id);
                          return (
                            <button
                              key={member.id}
                              type="button"
                              onClick={() => handleMemberToggle(member.id)}
                              className={`w-full px-4 py-2 text-left hover:bg-gray-50 transition-colors flex items-center gap-2 ${
                                isSelected ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className={`w-4 h-4 border-2 rounded flex items-center justify-center ${
                                isSelected
                                  ? 'border-blue-600 bg-blue-600'
                                  : 'border-gray-300'
                              }`}>
                                {isSelected && (
                                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                )}
                              </div>
                              <span className="text-sm text-gray-900">{member.name}</span>
                            </button>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
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
                    const logo = getBankLogo(bank.bankCode, (bank as any).originalBankCode);
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
              {submitting ? 'Đang cập nhật...' : 'Cập nhật'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FundEditModal;

