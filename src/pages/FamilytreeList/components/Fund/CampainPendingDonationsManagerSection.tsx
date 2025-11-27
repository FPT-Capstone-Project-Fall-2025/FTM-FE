import React, { useMemo, useState } from 'react';
import {
  RefreshCw,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Image,
  AlertTriangle,
} from 'lucide-react';
import { EmptyState } from './FundLoadingEmpty';

export interface CampaignPendingDonation {
  id: string;
  campaignId: string;
  campaignName: string | null;
  donorName: string | null;
  amount: number;
  message: string | null;
  status: string | null;
  createdAt: string | null;
  proofImages: string[] | string | null;
}

export interface CampaignPendingExpense {
  id: string;
  campaignId: string;
  campaignName: string | null;
  description: string | null;
  amount: number;
  receiptUrls: string[] | string | null;
  createdAt: string | null;
}

interface CampainPendingDonationsManagerSectionProps {
  pendingDonations: CampaignPendingDonation[];
  loading?: boolean;
  onRefresh?: () => void;
  onConfirm: (donationId: string, confirmationNotes?: string) => Promise<void>;
  onReject: (donationId: string, reason?: string) => Promise<void>;
  formatCurrency: (value?: number | null) => string;
  formatDate: (value?: string | null) => string;
  pendingExpenses: CampaignPendingExpense[];
  expenseLoading?: boolean;
  onRefreshExpenses?: () => void;
  onApproveExpense: (
    expenseId: string,
    payload: { notes?: string; paymentProofImages: File[] }
  ) => Promise<void>;
  onRejectExpense: (expenseId: string, reason?: string) => Promise<void>;
  expenseActionsDisabled?: boolean;
}

const normalizeProofImages = (
  proofImages: string[] | string | null | undefined
): string[] => {
  if (!proofImages) return [];
  if (Array.isArray(proofImages)) return proofImages.filter(Boolean);
  if (typeof proofImages === 'string') {
    if (proofImages.includes(',')) {
      return proofImages
        .split(',')
        .map(url => url.trim())
        .filter(Boolean);
    }
    return [proofImages];
  }
  return [];
};

const CampainPendingDonationsManagerSection: React.FC<
  CampainPendingDonationsManagerSectionProps
> = ({
  pendingDonations,
  loading = false,
  onRefresh,
  onConfirm,
  onReject,
  formatCurrency,
  formatDate,
  pendingExpenses,
  expenseLoading = false,
  onRefreshExpenses,
  onApproveExpense,
  onRejectExpense,
  expenseActionsDisabled = false,
}) => {
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedDonation, setSelectedDonation] =
      useState<CampaignPendingDonation | null>(null);
    const [confirmationNotes, setConfirmationNotes] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [confirmingId, setConfirmingId] = useState<string | null>(null);
    const [rejectingId, setRejectingId] = useState<string | null>(null);
    const [selectedExpenseId, setSelectedExpenseId] = useState<string | null>(null);
    const [expenseNotes, setExpenseNotes] = useState('');
    const [expenseProofImages, setExpenseProofImages] = useState<File[]>([]);
    const [approvingExpenseId, setApprovingExpenseId] = useState<string | null>(null);
    const [rejectingExpenseId, setRejectingExpenseId] = useState<string | null>(null);
    const [showExpenseApproveModal, setShowExpenseApproveModal] = useState(false);
    const [showExpenseRejectModal, setShowExpenseRejectModal] = useState(false);
    const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');

    const hasProofImages = useMemo(() => {
      if (!selectedDonation) return false;
      return normalizeProofImages(selectedDonation.proofImages).length > 0;
    }, [selectedDonation]);

    const proofImages = useMemo(() => {
      if (!selectedDonation) return [];
      return normalizeProofImages(selectedDonation.proofImages);
    }, [selectedDonation]);

    const selectedExpense = useMemo(
      () => pendingExpenses.find(exp => exp.id === selectedExpenseId) ?? null,
      [pendingExpenses, selectedExpenseId]
    );

    const handleOpenConfirm = (donation: CampaignPendingDonation) => {
      setSelectedDonation(donation);
      setConfirmationNotes('');
      setShowConfirmModal(true);
      setShowRejectModal(false);
    };

    const handleOpenReject = (donation: CampaignPendingDonation) => {
      setSelectedDonation(donation);
      setRejectionReason('');
      setShowRejectModal(true);
      setShowConfirmModal(false);
    };
    // Get unique campaigns from both donations and expenses
    const availableCampaigns = useMemo(() => {
      const campaignMap = new Map<string, string>();

      pendingDonations.forEach(donation => {
        if (donation.campaignId && donation.campaignName) {
          campaignMap.set(donation.campaignId, donation.campaignName);
        }
      });

      pendingExpenses.forEach(expense => {
        if (expense.campaignId && expense.campaignName) {
          campaignMap.set(expense.campaignId, expense.campaignName);
        }
      });

      return Array.from(campaignMap.entries()).map(([id, name]) => ({ id, name }));
    }, [pendingDonations, pendingExpenses]);
    // Filter donations and expenses by selected campaign
    const filteredDonations = useMemo(() => {
      if (!selectedCampaignId) return pendingDonations;
      return pendingDonations.filter(d => d.campaignId === selectedCampaignId);
    }, [pendingDonations, selectedCampaignId]);
    const filteredExpenses = useMemo(() => {
      if (!selectedCampaignId) return pendingExpenses;
      return pendingExpenses.filter(e => e.campaignId === selectedCampaignId);
    }, [pendingExpenses, selectedCampaignId]);

    const handleCloseModals = () => {
      setShowConfirmModal(false);
      setShowRejectModal(false);
      setSelectedDonation(null);
      setConfirmationNotes('');
      setRejectionReason('');
    };

    const handleConfirmSubmit = async () => {
      if (!selectedDonation) return;
      setConfirmingId(selectedDonation.id);
      try {
        await onConfirm(selectedDonation.id, confirmationNotes.trim() || undefined);
        handleCloseModals();
      } catch (error) {
        console.error('Failed to confirm campaign donation', error);
      } finally {
        setConfirmingId(null);
      }
    };

    const handleRejectSubmit = async () => {
      if (!selectedDonation) return;
      setRejectingId(selectedDonation.id);
      try {
        await onReject(selectedDonation.id, rejectionReason.trim() || undefined);
        handleCloseModals();
      } catch (error) {
        console.error('Failed to reject campaign donation', error);
      } finally {
        setRejectingId(null);
      }
    };

    const handleExpenseBack = () => {
      setSelectedExpenseId(null);
      setExpenseNotes('');
      setExpenseProofImages([]);
      setApprovingExpenseId(null);
      setRejectingExpenseId(null);
      setShowExpenseApproveModal(false);
      setShowExpenseRejectModal(false);
    };

    const handleOpenExpenseApprove = (expense: CampaignPendingExpense) => {
      setSelectedExpenseId(expense.id);
      setExpenseNotes('');
      setExpenseProofImages([]);
      setShowExpenseApproveModal(true);
    };

    const handleResetFilter = () => {
      setSelectedCampaignId('');
    };

    const handleOpenExpenseReject = (expense: CampaignPendingExpense) => {
      setSelectedExpenseId(expense.id);
      setExpenseNotes('');
      setShowExpenseRejectModal(true);
    };

    const handleApproveExpense = async () => {
      if (!selectedExpense) return;
      setApprovingExpenseId(selectedExpense.id);
      try {
        const trimmedNotes = expenseNotes.trim();
        const payload: { notes?: string; paymentProofImages: File[] } = {
          paymentProofImages: expenseProofImages,
        };
        if (trimmedNotes) {
          payload.notes = trimmedNotes;
        }
        await onApproveExpense(selectedExpense.id, payload);
        handleExpenseBack();
      } catch (error) {
        console.error('Failed to approve expense', error);
      } finally {
        setApprovingExpenseId(null);
      }
    };

    const handleRejectExpense = async () => {
      if (!selectedExpense) return;
      setRejectingExpenseId(selectedExpense.id);
      try {
        const trimmedNotes = expenseNotes.trim();
        await onRejectExpense(selectedExpense.id, trimmedNotes || undefined);
        handleExpenseBack();
      } catch (error) {
        console.error('Failed to reject expense', error);
      } finally {
        setRejectingExpenseId(null);
      }
    };

    const expenseReceipts = useMemo(() => {
      if (!selectedExpense) return [];
      return normalizeProofImages(selectedExpense.receiptUrls);
    }, [selectedExpense]);

    return (
      <>
        {/* Campaign Filter */}
        <div className="bg-white rounded-lg shadow p-4 flex flex-wrap items-center gap-3 mb-4">
          <label className="text-sm font-semibold text-gray-700">Chọn chiến dịch</label>
          <select
            value={selectedCampaignId}
            onChange={(e) => setSelectedCampaignId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          >
            <option value="">-- Chọn chiến dịch --</option>
            {availableCampaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={handleResetFilter}
            className="px-3 py-2 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-50"
          >
            Làm mới
          </button>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg shadow p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Phê duyệt ủng hộ</h3>
                <p className="text-sm text-gray-500">
                  Xác nhận các khoản ủng hộ cho chiến dịch gây quỹ
                </p>
              </div>
              {onRefresh && (
                <button
                  type="button"
                  onClick={onRefresh}
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : 'text-gray-600'
                      }`}
                  />
                  Làm mới
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 mt-4">
              {filteredDonations.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle className="w-12 h-12 text-gray-300" />}
                  title="Không có yêu cầu cần phê duyệt"
                  description="Không có ủng hộ chiến dịch nào đang chờ xác nhận."
                />
              ) : (
                <div className="space-y-4 pr-2">
                  {filteredDonations.map((item) => (
                    <div key={item.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex flex-col md:flex-row gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm text-blue-700 font-semibold uppercase tracking-wide">
                              {item.campaignName || '—'}
                            </p>
                            <h4 className="text-2xl font-bold text-gray-900 mt-1">
                              {formatCurrency(item.amount)}
                            </h4>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Người ủng hộ:</span>
                            <span className="font-semibold text-gray-900 ml-2">
                              {item.donorName || 'Ẩn danh'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{formatDate(item.createdAt)}</span>
                          </div>
                          {item.message && (
                            <div className="md:col-span-2">
                              <span className="text-gray-600">Lời nhắn:</span>
                              <span className="text-gray-900 ml-2">{item.message}</span>
                            </div>
                          )}
                          {normalizeProofImages(item.proofImages).length > 0 ? (
                            <div className="md:col-span-2">
                              <span className="text-gray-600">Ảnh xác minh:</span>
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {normalizeProofImages(item.proofImages).slice(0, 4).map((url, index) => (
                                  <a
                                    key={index}
                                    href={url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block w-16 h-16 rounded border border-gray-200 overflow-hidden bg-gray-100"
                                  >
                                    <img
                                      src={url}
                                      alt={`Proof ${index + 1}`}
                                      className="w-full h-full object-cover"
                                    />
                                  </a>
                                ))}
                                {normalizeProofImages(item.proofImages).length > 4 && (
                                  <span className="text-xs text-gray-500 self-center">
                                    +{normalizeProofImages(item.proofImages).length - 4}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 md:col-span-2">
                              Chưa có ảnh xác minh thanh toán
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col gap-2 lg:min-w-[220px]">
                        <button
                          type="button"
                          onClick={() => handleOpenConfirm(item)}
                          disabled={confirmingId === item.id || rejectingId === item.id}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {confirmingId === item.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Đang phê duyệt...
                            </>
                          ) : (
                            <>
                              <CheckCircle className="w-4 h-4" />
                              Phê duyệt
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenReject(item)}
                          disabled={confirmingId === item.id || rejectingId === item.id}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          {rejectingId === item.id ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Đang từ chối...
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4" />
                              Từ chối
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div >
          </div >

          <div className="bg-white rounded-lg shadow p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Phê duyệt rút tiền</h3>
                <p className="text-sm text-gray-500">Xét duyệt các yêu cầu chi tiêu chiến dịch</p>
              </div>
              {onRefreshExpenses && (
                <button
                  type="button"
                  onClick={onRefreshExpenses}
                  disabled={expenseLoading || expenseActionsDisabled}
                  className="inline-flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <RefreshCw
                    className={`w-4 h-4 ${expenseLoading ? 'animate-spin text-blue-600' : 'text-gray-600'
                      }`}
                  />
                  Làm mới
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 mt-4">
              {filteredExpenses.length === 0 ? (
                <EmptyState
                  icon={<AlertTriangle className="w-12 h-12 text-gray-300" />}
                  title="Không có yêu cầu chi tiêu"
                  description="Chưa có yêu cầu rút tiền nào chờ phê duyệt."
                />
              ) : (
                <div className="space-y-4 pr-2">
                  {filteredExpenses.map((exp) => (
                    <div key={exp.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100 flex flex-col md:flex-row gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-sm text-blue-700 font-semibold uppercase tracking-wide">
                              {exp.campaignName || '—'}
                            </p>
                            <h4 className="text-2xl font-bold text-gray-900 mt-1">
                              {formatCurrency(exp.amount)}
                            </h4>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div>
                            <span className="text-gray-600">Hạng mục:</span>
                            <span className="font-semibold text-gray-900 ml-2">
                              {exp.description || 'Chi tiêu'}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="w-4 h-4" />
                            <span>{formatDate(exp.createdAt)}</span>
                          </div>
                          {normalizeProofImages(exp.receiptUrls).length > 0 ? (
                            <div className="md:col-span-2">
                              <span className="text-gray-600">Hoá đơn đính kèm:</span>
                              <div className="flex gap-2 mt-2 flex-wrap">
                                {normalizeProofImages(exp.receiptUrls)
                                  .slice(0, 4)
                                  .map((url, idx) => (
                                    <a
                                      key={idx}
                                      href={url}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="block w-14 h-14 rounded border border-gray-200 overflow-hidden bg-gray-100"
                                    >
                                      <img src={url} alt="" className="w-full h-full object-cover" />
                                    </a>
                                  ))}
                                {normalizeProofImages(exp.receiptUrls).length > 4 && (
                                  <span className="text-xs text-gray-500 self-center">
                                    +{normalizeProofImages(exp.receiptUrls).length - 4}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 md:col-span-2">
                              Chưa có hoá đơn đính kèm
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 lg:min-w-[220px]">
                        <button
                          type="button"
                          onClick={() => handleOpenExpenseApprove(exp)}
                          disabled={expenseActionsDisabled}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Phê duyệt
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenExpenseReject(exp)}
                          disabled={expenseActionsDisabled}
                          className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                          <XCircle className="w-4 h-4" />
                          Từ chối
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div >
          </div >
        </div >

        {showConfirmModal && selectedDonation && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full my-8 max-h-[90vh] flex flex-col">
              <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900">Phê duyệt ủng hộ</h3>
                    <p className="text-sm text-gray-500">Xác nhận ủng hộ chiến dịch</p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModals}
                  className="text-sm font-semibold text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  type="button"
                  disabled={confirmingId === selectedDonation.id}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto flex-1">
                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Chiến dịch:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {selectedDonation.campaignName || '—'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Số tiền:</span>
                    <span className="text-lg font-bold text-gray-900">
                      {formatCurrency(selectedDonation.amount)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Người ủng hộ:</span>
                    <span className="text-sm font-semibold text-gray-900">
                      {selectedDonation.donorName || 'Ẩn danh'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Thời gian:</span>
                    <span className="text-sm text-gray-900">
                      {formatDate(selectedDonation.createdAt)}
                    </span>
                  </div>
                  {selectedDonation.message && (
                    <div className="pt-2 border-t border-gray-200">
                      <span className="text-sm text-gray-600">Lời nhắn:</span>
                      <p className="text-sm text-gray-900 mt-1">{selectedDonation.message}</p>
                    </div>
                  )}
                </div>

                {hasProofImages ? (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ảnh xác minh
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {proofImages.map((url, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={url}
                            alt={`Proof ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/50 transition-colors rounded-lg"
                          >
                            <Image className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-sm text-yellow-800 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Chưa có ảnh xác minh thanh toán.
                    </p>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ghi chú phê duyệt (tùy chọn)
                  </label>
                  <textarea
                    value={confirmationNotes}
                    onChange={e => setConfirmationNotes(e.target.value)}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Ví dụ: Đã xác nhận chuyển khoản, Đã nhận tiền mặt..."
                    disabled={confirmingId === selectedDonation.id}
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={handleCloseModals}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                  disabled={confirmingId === selectedDonation.id}
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  disabled={confirmingId === selectedDonation.id}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {confirmingId === selectedDonation.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang phê duyệt...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Phê duyệt
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {
          showRejectModal && selectedDonation && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-xl shadow-2xl max-w-md w-full my-8 max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Từ chối ủng hộ</h3>
                      <p className="text-sm text-gray-500">Từ chối khoản ủng hộ này</p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModals}
                    className="text-sm font-semibold text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    type="button"
                    disabled={rejectingId === selectedDonation.id}
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Chiến dịch:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedDonation.campaignName || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Số tiền:</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(selectedDonation.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Người ủng hộ:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedDonation.donorName || 'Ẩn danh'}
                      </span>
                    </div>
                    {selectedDonation.message && (
                      <div className="pt-2 border-t border-gray-200">
                        <span className="text-sm text-gray-600">Lời nhắn:</span>
                        <p className="text-sm text-gray-900 mt-1">{selectedDonation.message}</p>
                      </div>
                    )}
                  </div>

                  {hasProofImages && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Ảnh xác minh
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {proofImages.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={url}
                              alt={`Proof ${index + 1}`}
                              className="w-full h-24 object-cover rounded-lg border border-gray-200"
                            />
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/50 transition-colors rounded-lg"
                            >
                              <Image className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Lý do từ chối (tuỳ chọn)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={e => setRejectionReason(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Hãy ghi rõ lý do để thành viên nắm được thông tin..."
                      disabled={rejectingId === selectedDonation.id}
                    />
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleCloseModals}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                    disabled={rejectingId === selectedDonation.id}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleRejectSubmit}
                    disabled={rejectingId === selectedDonation.id}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {rejectingId === selectedDonation.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang từ chối...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Từ chối
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {
          showExpenseApproveModal && selectedExpense && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full my-8 max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Phê duyệt rút tiền</h3>
                      <p className="text-sm text-gray-500">Xác nhận khoản chi tiêu chiến dịch</p>
                    </div>
                  </div>
                  <button
                    onClick={handleExpenseBack}
                    className="text-sm font-semibold text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    type="button"
                    disabled={approvingExpenseId === selectedExpense.id}
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Chiến dịch:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedExpense.campaignName || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Số tiền:</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(selectedExpense.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Hạng mục:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedExpense.description || 'Chi tiêu'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Thời gian:</span>
                      <span className="text-sm text-gray-900">
                        {formatDate(selectedExpense.createdAt)}
                      </span>
                    </div>
                  </div>

                  {expenseReceipts.length > 0 && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Hoá đơn đính kèm
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {expenseReceipts.slice(0, 6).map((url, index) => (
                          <a
                            key={index}
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                            className="relative block rounded-lg border border-gray-200 overflow-hidden bg-gray-50"
                          >
                            <img src={url} alt="" className="w-full h-24 object-cover" />
                          </a>
                        ))}
                        {expenseReceipts.length > 6 && (
                          <span className="text-xs text-gray-500 self-center">
                            +{expenseReceipts.length - 6}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ghi chú phê duyệt
                    </label>
                    <textarea
                      value={expenseNotes}
                      onChange={e => setExpenseNotes(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="Ví dụ: Đã chuyển khoản, hoá đơn hợp lệ..."
                      disabled={approvingExpenseId === selectedExpense.id}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Ảnh xác minh thanh toán <span className="text-red-500">*</span>
                    </label>
                    <label className="inline-flex items-center gap-2 px-3 py-2 border border-dashed border-emerald-400 rounded-lg text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 cursor-pointer transition-colors w-max">
                      Tải ảnh
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        disabled={approvingExpenseId === selectedExpense.id}
                        className="hidden"
                        onChange={e => {
                          const files = e.target.files ? Array.from(e.target.files) : [];
                          setExpenseProofImages(files);
                          e.currentTarget.value = '';
                        }}
                      />
                    </label>
                    {expenseProofImages.length > 0 && (
                      <p className="text-xs text-gray-500 mt-2">
                        {expenseProofImages.length} ảnh đã chọn
                      </p>
                    )}
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleExpenseBack}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                    disabled={approvingExpenseId === selectedExpense.id}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleApproveExpense}
                    disabled={
                      approvingExpenseId === selectedExpense.id ||
                      !expenseProofImages.length
                    }
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                    title={!expenseProofImages.length ? 'Cần tải lên ảnh xác minh thanh toán' : ''}
                  >
                    {approvingExpenseId === selectedExpense.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang phê duyệt...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4" />
                        Xác nhận phê duyệt
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        }

        {
          showExpenseRejectModal && selectedExpense && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
              <div className="bg-white rounded-xl shadow-2xl max-w-xl w-full my-8 max-h-[90vh] flex flex-col">
                <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <XCircle className="w-5 h-5 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">Từ chối rút tiền</h3>
                      <p className="text-sm text-gray-500">Nêu lý do từ chối khoản chi tiêu</p>
                    </div>
                  </div>
                  <button
                    onClick={handleExpenseBack}
                    className="text-sm font-semibold text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    type="button"
                    disabled={rejectingExpenseId === selectedExpense.id}
                  >
                    <XCircle className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                  <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Chiến dịch:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedExpense.campaignName || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Số tiền:</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(selectedExpense.amount)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Hạng mục:</span>
                      <span className="text-sm font-semibold text-gray-900">
                        {selectedExpense.description || 'Chi tiêu'}
                      </span>
                    </div>
                    {expenseReceipts.length > 0 && (
                      <div className="pt-2 border-t border-gray-200">
                        <span className="text-sm text-gray-600">Hoá đơn đính kèm:</span>
                        <div className="flex gap-2 mt-2 flex-wrap">
                          {expenseReceipts.slice(0, 4).map((url, index) => (
                            <a
                              key={index}
                              href={url}
                              target="_blank"
                              rel="noreferrer"
                              className="block w-14 h-14 rounded border border-gray-200 overflow-hidden bg-gray-100"
                            >
                              <img src={url} alt="" className="w-full h-full object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Lý do từ chối <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={expenseNotes}
                      onChange={e => setExpenseNotes(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      placeholder="Vui lòng nhập lý do từ chối khoản rút tiền này..."
                      disabled={rejectingExpenseId === selectedExpense.id}
                    />
                    <p className="mt-1 text-xs text-gray-500">
                      Lý do sẽ được gửi tới người đề nghị rút tiền
                    </p>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 flex-shrink-0">
                  <button
                    type="button"
                    onClick={handleExpenseBack}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                    disabled={rejectingExpenseId === selectedExpense.id}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    onClick={handleRejectExpense}
                    disabled={
                      rejectingExpenseId === selectedExpense.id || !expenseNotes.trim()
                    }
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {rejectingExpenseId === selectedExpense.id ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang từ chối...
                      </>
                    ) : (
                      <>
                        <XCircle className="w-4 h-4" />
                        Xác nhận từ chối
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )
        }
      </>
    );
  };

export default CampainPendingDonationsManagerSection;


