import React, { useState, useRef, useEffect } from 'react';
import { Loader2, RefreshCw, Clock, AlertTriangle, Upload, Image, X, XCircle } from 'lucide-react';
import type { MyPendingDonation } from '@/types/fund';
import { EmptyState } from './FundLoadingEmpty';

interface FundPendingDonationsSectionProps {
  pendingDonations: MyPendingDonation[];
  loading?: boolean;
  onRefresh?: () => void;
  onUploadProof: (donationId: string, files: File[]) => Promise<void>;
  formatCurrency: (value?: number | null) => string;
  formatDate: (value?: string | null) => string;
  getPaymentMethodLabel: (method: unknown) => string;
}

const FundPendingDonationsSection: React.FC<FundPendingDonationsSectionProps> = ({
  pendingDonations,
  loading = false,
  onRefresh,
  onUploadProof,
  formatCurrency,
  formatDate,
  getPaymentMethodLabel,
}) => {
  const [selectedDonation, setSelectedDonation] = useState<MyPendingDonation | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [proofFiles, setProofFiles] = useState<File[]>([]);
  const [proofPreviews, setProofPreviews] = useState<string[]>([]);
  const [uploadingProof, setUploadingProof] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDonationClick = (donation: MyPendingDonation) => {
    setSelectedDonation(donation);
    setProofFiles([]);
    setProofPreviews([]);
    setShowUploadModal(true);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate file types and sizes
    const validFiles = files.filter(file => {
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} không phải là ảnh. Vui lòng chọn file ảnh.`);
        return false;
      }
      if (file.size > 10 * 1024 * 1024) {
        alert(`File ${file.name} quá lớn. Kích thước tối đa là 10MB.`);
        return false;
      }
      return true;
    });

    // Add new files
    const newFiles = [...proofFiles, ...validFiles].slice(0, 10); // Max 10 files
    setProofFiles(newFiles);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProofPreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeProofFile = (index: number) => {
    setProofFiles(prev => prev.filter((_, i) => i !== index));
    setProofPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadProof = async () => {
    if (!selectedDonation || proofFiles.length === 0) return;

    console.log('[FundPendingDonationsSection.handleUploadProof] Starting upload', {
      donationId: selectedDonation.id,
      fundDonationId: selectedDonation.id,
      filesCount: proofFiles.length,
      fileNames: proofFiles.map(f => f.name),
      selectedDonation: selectedDonation,
    });

    setUploadingProof(true);
    try {
      console.log('[FundPendingDonationsSection.handleUploadProof] Calling onUploadProof with donationId:', selectedDonation.id);
      await onUploadProof(selectedDonation.id, proofFiles);
      console.log('[FundPendingDonationsSection.handleUploadProof] Upload successful');
      
      // Clear files after successful upload
      setProofFiles([]);
      setProofPreviews([]);
      // Don't close modal immediately - keep it open to show updated proof images
      // Refresh donations first to get updated proof images
      if (onRefresh) {
        console.log('[FundPendingDonationsSection.handleUploadProof] Refreshing donations...');
        await onRefresh();
        console.log('[FundPendingDonationsSection.handleUploadProof] Donations refreshed');
      }
      // Update selectedDonation with new proof images from the refreshed list
      // The modal will show updated images from the refreshed pendingDonations
      // Close modal after a short delay to show success
      setTimeout(() => {
        setShowUploadModal(false);
        setSelectedDonation(null);
      }, 1000);
    } catch (error) {
      console.error('[FundPendingDonationsSection.handleUploadProof] Failed to upload proof', {
        error,
        donationId: selectedDonation.id,
        fundDonationId: selectedDonation.id,
      });
      throw error;
    } finally {
      setUploadingProof(false);
    }
  };

  const handleCancelUpload = () => {
    setShowUploadModal(false);
    setSelectedDonation(null);
    setProofFiles([]);
    setProofPreviews([]);
  };

  // Sync selectedDonation with latest data from props after refresh
  useEffect(() => {
    if (selectedDonation) {
      const latestDonation = pendingDonations.find(d => d.id === selectedDonation.id);
      if (latestDonation) {
        console.log('[FundPendingDonationsSection] Updating selectedDonation with latest data', {
          oldId: selectedDonation.id,
          newId: latestDonation.id,
          hasProofImages: latestDonation.proofImages?.length || 0,
        });
        setSelectedDonation(latestDonation);
      } else {
        console.warn('[FundPendingDonationsSection] selectedDonation not found in pendingDonations', {
          selectedDonationId: selectedDonation.id,
          pendingDonationIds: pendingDonations.map(d => d.id),
        });
      }
    }
  }, [pendingDonations, selectedDonation?.id]);

  // Find the latest donation data from props to get updated proof images
  const latestDonation = pendingDonations.find(d => d.id === selectedDonation?.id);
  const currentDonation = latestDonation || selectedDonation;
  
  // Normalize proofImages to always be an array
  const normalizeProofImages = (proofImages: string[] | string | null | undefined): string[] => {
    if (!proofImages) return [];
    if (Array.isArray(proofImages)) return proofImages;
    if (typeof proofImages === 'string') {
      // Handle comma-separated string
      if (proofImages.includes(',')) {
        return proofImages.split(',').map(url => url.trim()).filter(Boolean);
      }
      // Single URL string
      return [proofImages];
    }
    return [];
  };
  
  const proofImagesArray = normalizeProofImages(currentDonation?.proofImages);
  const hasProofImages = proofImagesArray.length > 0;

  return (
    <>
      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Yêu cầu nạp của tôi</h3>
            <p className="text-sm text-gray-500">Các khoản nạp chưa được quản trị viên xác nhận</p>
          </div>
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-1 text-sm font-semibold rounded-lg border border-gray-300 bg-white hover:bg-gray-100 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <RefreshCw
                className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : 'text-gray-600'}`}
              />
              Làm mới
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          </div>
        ) : pendingDonations.length === 0 ? (
          <EmptyState
            icon={<AlertTriangle className="w-12 h-12 text-gray-300" />}
            title="Không có yêu cầu nạp đang chờ"
            description="Những yêu cầu nạp quỹ của bạn sẽ hiển thị tại đây cho đến khi được xác nhận."
          />
        ) : (
          <div className="space-y-3">
            {pendingDonations.map(item => (
              <div
                key={item.id}
                onClick={() => handleDonationClick(item)}
                className="border border-amber-200 bg-amber-50 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex-1">
                  <p className="text-sm text-amber-700 font-semibold uppercase tracking-wide">
                    {item.fundName || 'Quỹ chưa xác định'}
                  </p>
                  <h4 className="text-xl font-bold text-gray-900">
                    {formatCurrency(item.donationMoney)}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Phương thức: {getPaymentMethodLabel(item.paymentMethod)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Ghi chú: {item.paymentNotes?.trim() || 'Không có'}
                  </p>
                  {(() => {
                    const itemProofImages = normalizeProofImages(item.proofImages);
                    return itemProofImages.length > 0 && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <Image className="w-3 h-3" />
                        Đã upload {itemProofImages.length} ảnh chứng từ
                    </p>
                    );
                  })()}
                </div>
                <div className="text-sm text-gray-600 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  {formatDate(item.createdDate)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Proof Modal */}
      {showUploadModal && selectedDonation && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full my-8 max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Upload className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Upload ảnh chứng từ</h3>
                  <p className="text-sm text-gray-500">Upload ảnh chứng từ cho khoản nạp quỹ</p>
                </div>
              </div>
              <button
                onClick={handleCancelUpload}
                className="text-sm font-semibold text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                type="button"
                disabled={uploadingProof}
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Số tiền:</span>
                  <span className="text-lg font-bold text-gray-900">
                    {formatCurrency(selectedDonation.donationMoney)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Phương thức:</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {getPaymentMethodLabel(selectedDonation.paymentMethod)}
                  </span>
                </div>
                {selectedDonation.paymentNotes && (
                  <div className="pt-2 border-t border-gray-200">
                    <span className="text-sm text-gray-600">Ghi chú:</span>
                    <p className="text-sm text-gray-900 mt-1">{selectedDonation.paymentNotes}</p>
                  </div>
                )}
              </div>

              {/* Existing proof images from server */}
              {hasProofImages && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Ảnh chứng từ đã upload:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {proofImagesArray.map((url, index) => (
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

              {/* New proof images to upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Ảnh chứng từ mới
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Upload ảnh chứng từ để quản trị viên xác nhận khoản nạp quỹ của bạn.
                </p>

                {proofPreviews.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-gray-600 mb-2">Ảnh sẽ upload:</p>
                    <div className="grid grid-cols-3 gap-2">
                      {proofPreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-24 object-cover rounded-lg border border-gray-200"
                          />
                          <button
                            type="button"
                            onClick={() => removeProofFile(index)}
                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* File input */}
                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={uploadingProof}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingProof || proofFiles.length >= 10}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-60 disabled:cursor-not-allowed text-sm font-semibold"
                  >
                    <Upload className="w-4 h-4" />
                    {proofFiles.length > 0 ? `Thêm ảnh (${proofFiles.length}/10)` : 'Chọn ảnh chứng từ'}
                  </button>
                </div>
                {proofFiles.length >= 10 && (
                  <p className="text-xs text-red-500 mt-1">Đã đạt giới hạn 10 ảnh</p>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3 flex-shrink-0">
              <button
                type="button"
                onClick={handleCancelUpload}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                disabled={uploadingProof}
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={handleUploadProof}
                disabled={uploadingProof || proofFiles.length === 0}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {uploadingProof ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Đang upload...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Upload ảnh
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FundPendingDonationsSection;

