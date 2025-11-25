import React from 'react';
import { X, AlertCircle } from 'lucide-react';

interface ExceptionPopupProps {
    isOpen: boolean;
    message: string;
    timestamp: Date;
    onClose: () => void;
}

const ExceptionPopup: React.FC<ExceptionPopupProps> = ({
    isOpen,
    message,
    timestamp,
    onClose,
}) => {
    if (!isOpen) return null;

    const formatTimestamp = (date: Date): string => {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full animate-fade-in">
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-red-700 text-white px-6 py-4 rounded-t-xl flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-6 h-6" />
                        <h3 className="text-lg font-bold">Lỗi</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                        type="button"
                        aria-label="Đóng"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Error Message */}
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-gray-900 text-sm leading-relaxed">{message}</p>
                    </div>

                    {/* Timestamp */}
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-200">
                        <span>Thời gian xảy ra lỗi:</span>
                        <span className="font-mono font-semibold text-gray-700">
                            {formatTimestamp(timestamp)}
                        </span>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 pb-6">
                    <button
                        onClick={onClose}
                        className="w-full px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold"
                        type="button"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ExceptionPopup;
