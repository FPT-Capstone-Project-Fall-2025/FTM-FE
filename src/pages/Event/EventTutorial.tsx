import React, { useState, useEffect, useCallback } from 'react';
import {
    X, ChevronLeft, ChevronRight,
    Calendar, Search, Filter, Plus,
    MapPin, LayoutList
} from 'lucide-react';

interface EventTutorialProps {
    onClose: () => void;
}

interface Slide {
    id: number;
    title: string;
    content: string[];
    visual: React.ReactNode;
}

const EventTutorial: React.FC<EventTutorialProps> = ({ onClose }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides: Slide[] = [
        {
            id: 1,
            title: 'Quản lý Sự kiện & Lịch',
            content: [
                'Theo dõi tất cả sự kiện quan trọng của gia tộc',
                'Bao gồm: Ngày giỗ, Lễ tết, Sinh nhật, Cưới hỏi...',
                'Hỗ trợ cả Lịch Dương và Lịch Âm',
                'Tự động nhắc nhở các sự kiện sắp tới'
            ],
            visual: (
                <div className="flex items-center justify-center h-64">
                    <div className="relative">
                        <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl">
                            <Calendar className="w-16 h-16 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center animate-pulse">
                            <span className="text-white text-xs font-bold">12</span>
                        </div>
                        <div className="absolute bottom-2 left-2 px-2 py-1 bg-white/20 backdrop-blur rounded text-white text-xs">
                            Âm lịch
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 2,
            title: 'Các chế độ xem Lịch',
            content: [
                'Linh hoạt chuyển đổi giữa các chế độ xem:',
                '• Ngày: Xem chi tiết sự kiện trong một ngày',
                '• Tuần: Lên kế hoạch cho tuần tới',
                '• Tháng: Tổng quan sự kiện trong tháng',
                '• Năm: Xem toàn cảnh sự kiện cả năm'
            ],
            visual: (
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <div className="flex justify-center gap-2 mb-6">
                        <div className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm font-medium">Tháng</div>
                        <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm">Tuần</div>
                        <div className="px-3 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm">Ngày</div>
                    </div>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs text-gray-400 mb-2">
                        <div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div><div>CN</div>
                    </div>
                    <div className="grid grid-cols-7 gap-1">
                        {[...Array(28)].map((_, i) => (
                            <div key={i} className={`h-8 rounded flex items-center justify-center text-xs ${i === 14 ? 'bg-blue-500 text-white font-bold shadow-md transform scale-110' : 'bg-gray-50 text-gray-700'}`}>
                                {i + 1}
                            </div>
                        ))}
                    </div>
                </div>
            )
        },
        {
            id: 3,
            title: 'Tạo sự kiện mới',
            content: [
                'Cách 1: Bấm trực tiếp vào một ngày trên lịch hoặc nhấn nút "Thêm sự kiện mới"',
                'Cách 2: Kéo thả chuột để chọn khoảng thời gian (Nhiều ngày)',
                'Sau đó điền thông tin: Tên, Địa điểm, Loại sự kiện...',
                'Có thể đặt lịch lặp lại hàng năm (Ví dụ: Sinh nhật, Giỗ)'
            ],
            visual: (
                <div className="relative h-48 bg-gray-50 rounded-xl border border-dashed border-gray-300 flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-blue-50/50"></div>
                    <div className="relative z-10 bg-white p-4 rounded-xl shadow-lg border border-blue-100 w-64 animate-slideUp">
                        <div className="flex items-center gap-2 mb-3 text-blue-800 font-semibold border-b border-blue-100 pb-2">
                            <Plus className="w-4 h-4" />
                            Thêm sự kiện mới
                        </div>
                        <div className="space-y-2">
                            <div className="h-2 bg-gray-100 rounded w-full"></div>
                            <div className="h-2 bg-gray-100 rounded w-3/4"></div>
                            <div className="flex gap-2 mt-2">
                                <div className="h-6 w-16 bg-blue-500 rounded"></div>
                                <div className="h-6 w-16 bg-gray-200 rounded"></div>
                            </div>
                        </div>
                        {/* Cursor Icon */}
                        <div className="absolute -bottom-8 -right-8 text-gray-800 opacity-50">
                            <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" viewBox="0 0 24 24" fill="currentColor" className="transform rotate-[-45deg]"><path d="M7 2l12 11.2-5.8.5 3.3 7.3-2.2.9-3.2-7.4-4.4 4.6z" /></svg>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 4,
            title: 'Tìm kiếm & Lọc',
            content: [
                'Tìm nhanh sự kiện bằng từ khóa',
                'Lọc theo loại sự kiện: Sinh nhật, Giỗ, Cưới hỏi...',
                'Lọc theo địa điểm tổ chức',
                'Lọc theo gia tộc (Nếu bạn thuộc nhiều gia tộc)'
            ],
            visual: (
                <div className="space-y-4">
                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex items-center gap-2">
                        <Search className="w-5 h-5 text-gray-400" />
                        <div className="h-2 bg-gray-100 rounded w-full"></div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <div className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium flex items-center gap-1">
                            Sinh nhật
                        </div>
                        <div className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                            Cưới hỏi
                        </div>
                        <div className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium flex items-center gap-1">
                            Giỗ chạp
                        </div>
                        <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium flex items-center gap-1 border border-blue-100">
                            <Filter className="w-3 h-3" />
                            Bộ lọc khác
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 5,
            title: 'Chi tiết sự kiện',
            content: [
                'Bấm vào sự kiện để xem chi tiết',
                'Xem danh sách thành viên tham gia',
                'Xem hình ảnh, địa điểm và ghi chú',
                'Chỉnh sửa hoặc xóa sự kiện (Nếu có quyền)'
            ],
            visual: (
                <div className="bg-white rounded-xl overflow-hidden border border-gray-200 shadow-md">
                    <div className="h-24 bg-gradient-to-r from-blue-400 to-indigo-500 relative">
                        <div className="absolute bottom-2 left-4 text-white font-bold text-lg text-shadow">Lễ Mừng Thọ</div>
                    </div>
                    <div className="p-4 space-y-3">
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <LayoutList className="w-4 h-4" />
                            <span>Ngày 12/05/2024 (05/04 ÂL)</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span>Nhà thờ tổ, Nam Định</span>
                        </div>
                        <div className="flex -space-x-2 pt-2">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                    {String.fromCharCode(65 + i)}
                                </div>
                            ))}
                            <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-500">
                                +10
                            </div>
                        </div>
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
                <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-6">
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
                                    <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold mt-0.5">
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
                                        ? 'bg-blue-600 w-8'
                                        : index < currentSlide
                                            ? 'bg-blue-300'
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
                                        className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all font-medium flex items-center gap-2 shadow-lg hover:shadow-xl"
                                    >
                                        Tiếp theo
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={onClose}
                                    className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all font-medium shadow-lg hover:shadow-xl"
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

export default EventTutorial;
