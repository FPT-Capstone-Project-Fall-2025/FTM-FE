import React, { useState, useEffect, useCallback } from 'react';
import {
    X, ChevronLeft, ChevronRight,
    PiggyBank, Flag, HandCoins,
    History, BookOpen, AlertCircle
} from 'lucide-react';

interface FundManagementTutorialProps {
    onClose: () => void;
}

interface Slide {
    id: number;
    title: string;
    content: string[];
    visual: React.ReactNode;
}

const FundManagementTutorial: React.FC<FundManagementTutorialProps> = ({ onClose }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides: Slide[] = [
        {
            id: 1,
            title: 'Quản lý Quỹ Gia Tộc',
            content: [
                'Chào mừng bạn đến với Quản lý Quỹ',
                'Nơi minh bạch tài chính và hỗ trợ các hoạt động của gia tộc',
                'Hệ thống gồm 2 phần chính: Quỹ Gia Tộc (Thường niên) và Chiến dịch (Ngắn hạn)'
            ],
            visual: (
                <div className="flex items-center justify-center h-64">
                    <div className="relative">
                        <div className="w-32 h-32 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-2xl">
                            <PiggyBank className="w-16 h-16 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-400 rounded-full flex items-center justify-center animate-bounce">
                            <span className="text-yellow-900 text-xl font-bold">$</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 2,
            title: '1. Quỹ Gia Tộc',
            content: [
                'Đây là quỹ chung, hoạt động lâu dài của gia tộc',
                'Dùng cho: Bảo trì nhà thờ tổ, cúng giỗ hàng năm, thăm hỏi ốm đau...',
                'Nguồn thu: Đóng góp thường niên của các thành viên',
                'Quản lý: Các giao dịch thu/chi được ghi chép minh bạch'
            ],
            visual: (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200 shadow-inner">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-green-100 rounded-full">
                            <BookOpen className="w-8 h-8 text-green-700" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-green-800">Quỹ gia tộc</h3>
                            <p className="text-sm text-green-600">Hoạt động xuyên suốt</p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-gray-700">Duy trì nhà thờ tổ</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-gray-700">Lễ tết, giỗ chạp</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                            <span className="text-gray-700">Khuyến học, khuyến tài</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 3,
            title: '2. Chiến dịch',
            content: [
                'Các đợt gây quỹ ngắn hạn cho mục đích cụ thể',
                'Ví dụ: "Quyên góp xây lại cổng làng", "Ủng hộ bão lụt", "Mừng thọ cụ Tổ"...',
                'Mỗi chiến dịch có mục tiêu tài chính và thời gian cụ thể',
                'Tách biệt hoàn toàn với Quỹ Gia Tộc chung'
            ],
            visual: (
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-6 border border-orange-200 shadow-inner">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-orange-100 rounded-full">
                            <Flag className="w-8 h-8 text-orange-700" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-orange-800">Chiến dịch Gây quỹ</h3>
                            <p className="text-sm text-orange-600">Theo sự kiện cụ thể</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="relative pt-1">
                            <div className="flex mb-2 items-center justify-between">
                                <div>
                                    <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-orange-600 bg-orange-200">
                                        Tiến độ
                                    </span>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-semibold inline-block text-orange-600">
                                        70%
                                    </span>
                                </div>
                            </div>
                            <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-orange-200">
                                <div style={{ width: "70%" }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-orange-500"></div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <div className="flex-1 p-2 bg-white rounded text-center text-xs text-gray-600 border border-orange-100">
                                Mục tiêu: 50Tr
                            </div>
                            <div className="flex-1 p-2 bg-white rounded text-center text-xs text-gray-600 border border-orange-100">
                                Còn: 5 ngày
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 4,
            title: 'Cách đóng góp (Nộp quỹ)',
            content: [
                'Bấm nút "Nộp quỹ" hoặc "Quyên góp" trong từng chiến dịch',
                'Hỗ trợ chuyển khoản ngân hàng (có mã QR) hoặc tiền mặt',
                'Có thể nộp thay cho thành viên khác trong gia đình',
                'Vui lòng tải lên ảnh minh chứng để được phê duyệt'
            ],
            visual: (
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-around">
                        <div className="flex flex-col items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100 w-24">
                            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01" /><path d="M18 12h.01" /></svg>
                            </div>
                            <span className="text-xs font-medium text-center">Chuyển khoản</span>
                        </div>

                        <div className="flex flex-col items-center gap-2 p-3 bg-green-50 rounded-xl border border-green-100 w-24">
                            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-600">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="12" x="2" y="6" rx="2" /><circle cx="12" cy="12" r="2" /><path d="M6 12h.01" /><path d="M18 12h.01" /></svg>
                            </div>
                            <span className="text-xs font-medium text-center">Tiền mặt</span>
                        </div>
                    </div>
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center gap-2 text-sm text-yellow-800">
                        <AlertCircle className="w-4 h-4" />
                        Lưu ý: Chờ Thủ quỹ phê duyệt để hoàn tất.
                    </div>
                </div>
            )
        },
        {
            id: 5,
            title: 'Rút tiền & Minh bạch',
            content: [
                'Thành viên có thể tạo "Yêu cầu rút tiền" cho các hoạt động chung',
                'Cần ghi rõ lý do, số tiền và người thụ hưởng',
                'Mọi giao dịch thu/chi đều được lưu lại và công khai trong "Lịch sử giao dịch"',
                'Thủ quỹ sẽ xem xét và phê duyệt các yêu cầu'
            ],
            visual: (
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-red-100 text-red-600 rounded-full">
                                <HandCoins className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-sm font-semibold">Mua hoa cúng giỗ</p>
                                <p className="text-xs text-gray-500">Yêu cầu rút tiền</p>
                            </div>
                        </div>
                        <span className="text-sm font-bold text-red-600">-2.000.000đ</span>
                    </div>

                    <div className="flex justify-center">
                        <div className="border-l-2 border-dashed border-gray-300 h-6"></div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600">Q</div>
                            <span className="text-xs text-gray-600">Quản trị viên phê duyệt</span>
                        </div>
                        <div className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded font-medium">Đã duyệt</div>
                    </div>

                    <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg text-blue-800 text-sm">
                        <History className="w-4 h-4" />
                        <span>Xem lại tất cả tại tab "Lịch sử"</span>
                    </div>
                </div>
            )
        }
    ];

    const handleNext = useCallback(() => {
        if (currentSlide < slides.length - 1) {
            setCurrentSlide(prev => prev + 1);
        }
    }, [currentSlide, slides.length]);

    const handlePrevious = useCallback(() => {
        if (currentSlide > 0) {
            setCurrentSlide(prev => prev - 1);
        }
    }, [currentSlide]);

    const handleSkip = useCallback(() => {
        onClose();
    }, [onClose]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            } else if (e.key === 'ArrowRight') {
                handleNext();
            } else if (e.key === 'ArrowLeft') {
                handlePrevious();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose, handleNext, handlePrevious]);

    const currentSlideData = slides[currentSlide];
    const progress = ((currentSlide + 1) / slides.length) * 100;

    // Safety check
    if (!currentSlideData) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-slideUp">
                {/* Header */}
                <div className="relative bg-gradient-to-r from-green-600 to-emerald-700 text-white p-6">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 hover:bg-white/20 rounded-lg transition-colors"
                        aria-label="Đóng"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="pr-12">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur rounded-full text-sm font-medium mb-3">
                            <span>Bước {currentSlide + 1}/{slides.length}</span>
                        </div>
                        <h2 className="text-3xl font-bold">{currentSlideData.title}</h2>
                    </div>

                    {/* Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
                        <div
                            className="h-full bg-white transition-all duration-300 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8">
                    <div className="space-y-6">
                        {/* Visual Demonstration */}
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 min-h-[250px] flex items-center justify-center">
                            <div className="w-full max-w-md">
                                {currentSlideData.visual}
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="space-y-3">
                            {currentSlideData.content.map((text, index) => (
                                <div
                                    key={index}
                                    className="flex items-start gap-3 animate-fadeIn"
                                    style={{ animationDelay: `${index * 100}ms` }}
                                >
                                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
                                        {index + 1}
                                    </div>
                                    <p className="text-gray-700 leading-relaxed font-medium">{text}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Footer Navigation */}
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                    <div className="flex items-center justify-between">
                        {/* Progress Dots */}
                        <div className="flex gap-2">
                            {slides.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentSlide(index)}
                                    className={`w-2 h-2 rounded-full transition-all ${index === currentSlide
                                        ? 'bg-green-600 w-8'
                                        : index < currentSlide
                                            ? 'bg-green-300'
                                            : 'bg-gray-300'
                                        }`}
                                    aria-label={`Chuyển đến bước ${index + 1}`}
                                />
                            ))}
                        </div>

                        {/* Navigation Buttons */}
                        <div className="flex items-center gap-3">
                            {currentSlide > 0 && (
                                <button
                                    onClick={handlePrevious}
                                    className="px-4 py-2 border border-gray-300 rounded-xl hover:bg-gray-100 transition-colors font-medium text-gray-700 flex items-center gap-2"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                    Quay lại
                                </button>
                            )}

                            {currentSlide < slides.length - 1 ? (
                                <>
                                    <button
                                        onClick={handleSkip}
                                        className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors font-medium"
                                    >
                                        Bỏ qua
                                    </button>
                                    <button
                                        onClick={handleNext}
                                        className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all font-medium flex items-center gap-2 shadow-lg hover:shadow-xl"
                                    >
                                        Tiếp theo
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-xl transition-all font-medium shadow-lg hover:shadow-xl"
                                >
                                    Hoàn thành
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }

        .animate-slideUp {
          animation: slideUp 0.4s ease-out;
        }
      `}</style>
        </div>
    );
};

export default FundManagementTutorial;
