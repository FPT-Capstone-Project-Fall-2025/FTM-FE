import React, { useEffect, useRef, useState } from 'react';
import { FileUp, Trash2 } from 'lucide-react';
import type { FundDonation } from '@/types/fund';

interface FundProofModalProps {
  isOpen: boolean;
  donation: FundDonation | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (payload: { files: File[]; note: string }) => void;
}

const FundProofModal: React.FC<FundProofModalProps> = ({
  isOpen,
  donation,
  submitting = false,
  onClose,
  onSubmit,
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [note, setNote] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setSelectedFiles([]);
      setNote('');
    }
  }, [isOpen]);

  if (!isOpen || !donation) {
    return null;
  }

  const handleFilesSelected = (files: FileList | null) => {
    if (!files) return;
    const validFiles: File[] = [];
    Array.from(files).forEach(file => {
      if (file.type.startsWith('image/')) {
        validFiles.push(file);
      }
    });
    if (validFiles.length) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedFiles.length) {
      return;
    }
    onSubmit({ files: selectedFiles, note });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Tải chứng từ đóng góp quỹ</h3>
            <p className="text-sm text-gray-500">
              Khoản đóng góp: <span className="font-semibold text-gray-800">{donation.donorName}</span> –{' '}
              <span className="font-semibold text-blue-600">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 }).format(
                  donation.donationMoney ?? donation.donationAmount ?? 0
                )}
              </span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-sm font-semibold text-gray-500 hover:text-gray-700 disabled:opacity-60"
          >
            Đóng
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={e => handleFilesSelected(e.target.files)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center gap-3 text-gray-600 hover:text-blue-600 transition-colors"
              disabled={submitting}
            >
              <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileUp className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold">Chọn ảnh chứng từ</p>
                <p className="text-xs text-gray-500">Hỗ trợ nhiều ảnh, định dạng JPG, PNG</p>
              </div>
            </button>
          </div>

          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">
                Đã chọn {selectedFiles.length} ảnh chứng từ
              </h4>
              <ul className="space-y-2">
                {selectedFiles.map((file, index) => (
                  <li
                    key={`${file.name}-${index}`}
                    className="flex items-center justify-between bg-gray-50 border border-gray-200 rounded-lg px-4 py-2 text-sm"
                  >
                    <span className="text-gray-700 truncate">{file.name}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(index)}
                      className="text-red-500 hover:text-red-600"
                      title="Xóa ảnh"
                      disabled={submitting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Ghi chú xác nhận</label>
            <textarea
              value={note}
              onChange={e => setNote(e.target.value)}
              rows={3}
              placeholder="Nhập ghi chú (ví dụ: Đã nhận tiền mặt và lưu chứng từ)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={submitting}
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
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
              disabled={submitting || selectedFiles.length === 0}
            >
              {submitting ? 'Đang xử lý...' : 'Tải lên và xác nhận'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FundProofModal;

