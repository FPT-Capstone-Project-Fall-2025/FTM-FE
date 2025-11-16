import React, { useMemo, useState, useEffect } from 'react';
import { Megaphone, X, Search } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
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
  organizerName?: string;
  onClose: () => void;
  onFormChange: (field: keyof CampaignFormState, value: string | boolean) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  submitting?: boolean;
}

const FundCampaignModal: React.FC<FundCampaignModalProps> = ({
  isOpen,
  formState,
  organizerName,
  onClose,
  onFormChange,
  onSubmit,
  submitting = false,
}) => {
  const [bankSearch, setBankSearch] = useState('');

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
      STANDARDCHARTERED: WOO,
      STANDARD: WOO,
    }),
    []
  );

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
          bankCode: bank.bin || bank.bankCode, // Use bin as bankCode (API requires BIN), fallback to bankCode
          bankName: bank.bankName,
          fullName: bank.fullName,
          originalBankCode: bank.bankCode, // Keep original bankCode for logo mapping and display
        })),
    []
  );

  const filteredBanks = useMemo(() => {
    const keyword = bankSearch.trim().toLowerCase();
    if (!keyword) return banks;

    return banks.filter((bank: any) => {
      const original = (bank.originalBankCode || '').toLowerCase();
      const code = (bank.bankCode || '').toLowerCase();
      const name = (bank.bankName || '').toLowerCase();
      const full = (bank.fullName || '').toLowerCase();
      return original.includes(keyword) || code.includes(keyword) || name.includes(keyword) || full.includes(keyword);
    });
  }, [banks, bankSearch]);

  const getBankLogo = (code: string, originalCode?: string) => {
    const key = (originalCode || code).toUpperCase();
    return bankLogoMap[key] || null;
  };

  // Reset bank search when modal closes
  useEffect(() => {
    if (!isOpen) {
      setBankSearch('');
    }
  }, [isOpen]);

  const formattedTargetAmount = useMemo(() => {
    const digitsOnly = formState.targetAmount.replace(/\D/g, '');
    if (!digitsOnly) return '';
    return digitsOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  }, [formState.targetAmount]);

  const handleTargetAmountChange = (value: string) => {
    const digits = value.replace(/\D/g, '');
    onFormChange('targetAmount', digits);
  };

  const handleBankSelect = (bank: { bankCode: string; bankName: string; fullName?: string }) => {
    onFormChange('bankName', bank.bankName || '');
    // Save BIN to bankCode field
    onFormChange('bankCode', bank.bankCode || '');
    setBankSearch('');
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
                value={organizerName || formState.organizer}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
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
                Ngày bắt đầu <span className="text-red-500">*</span>
              </label>
              <DatePicker
                selected={formState.startDate ? new Date(formState.startDate) : null}
                onChange={(date: Date | null) => {
                  if (date) {
                    // Validate that start date is today or after today
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    const selectedDate = new Date(date);
                    selectedDate.setHours(0, 0, 0, 0);
                    
                    if (selectedDate < today) {
                      // Don't update if start date is before today
                      return;
                    }
                    
                    // Convert to YYYY-MM-DD format for storage
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    onFormChange('startDate', `${year}-${month}-${day}`);
                    
                    // If end date is before new start date, clear it
                    if (formState.endDate) {
                      const endDate = new Date(formState.endDate);
                      if (endDate <= selectedDate) {
                        onFormChange('endDate', '');
                      }
                    }
                  } else {
                    onFormChange('startDate', '');
                  }
                }}
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/yyyy"
                minDate={new Date()}
                selectsStart={false}
                selectsEnd={false}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                wrapperClassName="w-full"
              />
              <p className="mt-1 text-xs text-gray-500">Ngày bắt đầu phải là ngày hôm nay hoặc sau đó</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Ngày kết thúc <span className="text-red-500">*</span>
              </label>
              <DatePicker
                selected={formState.endDate ? new Date(formState.endDate) : null}
                onChange={(date: Date | null) => {
                  if (date) {
                    // Validate that end date is after start date
                    if (formState.startDate) {
                      const startDate = new Date(formState.startDate);
                      startDate.setHours(0, 0, 0, 0);
                      const selectedDate = new Date(date);
                      selectedDate.setHours(0, 0, 0, 0);
                      
                      if (selectedDate <= startDate) {
                        // Don't update if end date is not after start date
                        return;
                      }
                    }
                    // Convert to YYYY-MM-DD format for storage
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    onFormChange('endDate', `${year}-${month}-${day}`);
                  } else {
                    onFormChange('endDate', '');
                  }
                }}
                dateFormat="dd/MM/yyyy"
                placeholderText="dd/mm/yyyy"
                minDate={formState.startDate ? new Date(new Date(formState.startDate).setDate(new Date(formState.startDate).getDate() + 1)) : new Date(new Date().setDate(new Date().getDate() + 1))}
                selectsStart={false}
                selectsEnd={false}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                wrapperClassName="w-full"
              />
              <p className="mt-1 text-xs text-gray-500">Ngày kết thúc phải lớn hơn ngày bắt đầu</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Chọn ngân hàng</label>
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
                <div className="h-48 overflow-y-auto pr-1 border border-gray-200 rounded-lg p-2 bg-gray-50">
                  <div className="space-y-2">
                    {filteredBanks.map((bank: any) => {
                      const isSelected = formState.bankCode === bank.bankCode;
                      const logo = getBankLogo(bank.bankCode, bank.originalBankCode);
                      return (
                        <button
                          key={bank.bankCode}
                          type="button"
                          onClick={() => handleBankSelect(bank)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border transition-colors ${
                            isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                            {logo ? (
                              <img src={logo} alt={bank.bankName} className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-sm font-semibold text-gray-500">
                                {(bank.originalBankCode || bank.bankCode).slice(0, 2).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div className="text-left flex-1 min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate">{bank.bankName}</p>
                            {bank.fullName && (
                              <p className="text-xs text-gray-500 line-clamp-1">{bank.fullName}</p>
                            )}
                          </div>
                          <div className="text-xs text-gray-400 uppercase flex-shrink-0">{bank.originalBankCode || bank.bankCode}</div>
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
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Ngân hàng</label>
                <input
                  type="text"
                  value={formState.bankName}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  placeholder="Tên ngân hàng (tự động điền)"
                />
              </div>
              <div className="hidden">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mã ngân hàng</label>
                <input
                  type="text"
                  value={formState.bankCode}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 cursor-not-allowed"
                  placeholder="Mã ngân hàng (tự động điền)"
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
          </div>
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
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ghi chú</label>
            <textarea
              value={formState.notes}
              onChange={e => onFormChange('notes', e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Thông tin bổ sung về chiến dịch"
            />
          </div>

          

          <div className="flex items-center gap-3 hidden">
            <input
              id="campaign-is-public"
              type="checkbox"
              checked={formState.isPublic}
              onChange={e => onFormChange('isPublic', e.target.checked)}
              className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="campaign-is-public" className="text-sm text-gray-600 ">
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
