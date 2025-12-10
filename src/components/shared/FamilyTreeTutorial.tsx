import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, Users, UserPlus, Heart, Edit3, Trash2, Search, ZoomIn, Maximize2 } from 'lucide-react';

interface FamilyTreeTutorialProps {
    onClose: () => void;
}

interface Slide {
    id: number;
    title: string;
    content: string[];
    visual: React.ReactNode;
}

const FamilyTreeTutorial: React.FC<FamilyTreeTutorialProps> = ({ onClose }) => {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides: Slide[] = [
        {
            id: 1,
            title: 'Chào mừng đến với Gia phả',
            content: [
                'Gia phả giúp bạn xây dựng và quản lý cây gia đình dễ dàng',
                'Thêm thành viên, kết nối quan hệ và lưu giữ thông tin gia đình',
                'Hãy cùng tìm hiểu cách sử dụng qua 5 bước đơn giản'
            ],
            visual: (
                <div className="flex items-center justify-center h-64">
                    <div className="relative">
                        <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-2xl">
                            <Users className="w-16 h-16 text-white" />
                        </div>
                        <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                            <span className="text-white text-xl font-bold">!</span>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 2,
            title: 'Tạo thành viên đầu tiên',
            content: [
                '1. Nhấn nút "+ Thêm thành viên" ở giữa màn hình',
                '2. Chọn mối quan hệ (Cha, Mẹ, Anh, Em, v.v.)',
                '3. Điền thông tin cơ bản: Tên, giới tính, ngày sinh',
                '4. Thành viên này sẽ là gốc của cây gia đình bạn'
            ],
            visual: (
                <div className="space-y-4">
                    {/* Step 1: Button */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border-2 border-blue-300 animate-pulse">
                        <div className="flex items-center gap-2 text-blue-700">
                            <UserPlus className="w-5 h-5" />
                            <span className="font-semibold">Bước 1: Nhấn "+ Thêm thành viên"</span>
                        </div>
                    </div>

                    {/* Step 2: Relationship Selection */}
                    <div className="bg-white rounded-xl p-4 border-2 border-indigo-200">
                        <div className="flex items-center gap-2 text-indigo-700 mb-2">
                            <Heart className="w-5 h-5" />
                            <span className="font-semibold">Bước 2: Chọn mối quan hệ</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            {['Cha', 'Mẹ', 'Anh', 'Em', 'Con trai', 'Con gái'].map(rel => (
                                <div key={rel} className="px-3 py-2 bg-indigo-50 rounded-lg text-sm text-center border border-indigo-200">
                                    {rel}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Step 3: Form */}
                    <div className="bg-white rounded-xl p-4 border-2 border-purple-200">
                        <div className="space-y-2">
                            <div className="text-purple-700 font-semibold text-sm mb-2">Bước 3: Điền thông tin</div>
                            <div className="h-8 bg-gray-100 rounded border border-gray-300"></div>
                            <div className="h-8 bg-gray-100 rounded border border-gray-300"></div>
                            <div className="h-8 bg-gray-100 rounded border border-gray-300"></div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 3,
            title: 'Thêm con cái',
            content: [
                '1. Nhấn biểu tượng "+" trên thẻ thành viên bất kỳ',
                '2. Chọn "Con trai" hoặc "Con gái"',
                '3. Nhập thông tin về con',
                '4. Kết nối tự động được tạo với cha/mẹ'
            ],
            visual: (
                <div className="flex flex-col items-center gap-4">
                    {/* Parent Card */}
                    <div className="bg-white rounded-xl p-4 border-2 border-blue-300 shadow-lg relative group">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold">
                                P
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900">Phụ huynh</p>
                                <p className="text-xs text-gray-500">Cha/Mẹ</p>
                            </div>
                        </div>
                        {/* Add Button */}
                        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center shadow-lg cursor-pointer hover:bg-green-600 transition-all animate-bounce">
                            <span className="text-white text-xl font-bold">+</span>
                        </div>
                    </div>

                    {/* Arrow */}
                    <div className="text-gray-400">
                        <ChevronLeft className="w-6 h-6 rotate-[-90deg]" />
                    </div>

                    {/* Child Cards */}
                    <div className="flex gap-3">
                        <div className="bg-blue-50 rounded-xl p-3 border-2 border-blue-200 shadow">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-blue-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                    C1
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">Con trai</p>
                                    <p className="text-xs text-gray-500">Nam</p>
                                </div>
                            </div>
                        </div>
                        <div className="bg-pink-50 rounded-xl p-3 border-2 border-pink-200 shadow">
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-10 bg-pink-400 rounded-full flex items-center justify-center text-white text-sm font-bold">
                                    C2
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-800">Con gái</p>
                                    <p className="text-xs text-gray-500">Nữ</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 4,
            title: 'Thêm vợ/chồng',
            content: [
                '1. Nhấn biểu tượng "+" trên thẻ thành viên',
                '2. Chọn "Vợ/Chồng"',
                '3. Điền thông tin về người bạn đời',
                '4. Quan hệ hôn nhân được kết nối tự động'
            ],
            visual: (
                <div className="flex items-center justify-center gap-4">
                    {/* Person 1 */}
                    <div className="bg-white rounded-xl p-4 border-2 border-blue-300 shadow-lg">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                A
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-gray-900">Người 1</p>
                                <p className="text-xs text-gray-500">Nam</p>
                            </div>
                        </div>
                    </div>

                    {/* Heart Connection */}
                    <div className="flex flex-col items-center">
                        <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                            <Heart className="w-6 h-6 text-white fill-white" />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Vợ/Chồng</p>
                    </div>

                    {/* Person 2 */}
                    <div className="bg-white rounded-xl p-4 border-2 border-pink-300 shadow-lg">
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-16 h-16 bg-gradient-to-br from-pink-600 to-pink-700 rounded-full flex items-center justify-center text-white font-bold text-xl">
                                B
                            </div>
                            <div className="text-center">
                                <p className="font-semibold text-gray-900">Người 2</p>
                                <p className="text-xs text-gray-500">Nữ</p>
                            </div>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 5,
            title: 'Chỉnh sửa và xóa',
            content: [
                '1. Nhấn vào thẻ thành viên để xem chi tiết',
                '2. Dùng biểu tượng "Chỉnh sửa" để sửa thông tin',
                '3. Dùng biểu tượng "Xóa" để xóa thành viên',
                '4. Xác nhận thao tác trước khi thực hiện'
            ],
            visual: (
                <div className="space-y-4">
                    {/* Member Card with Actions */}
                    <div className="bg-white rounded-xl p-4 border-2 border-gray-300 shadow-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white font-bold">
                                    M
                                </div>
                                <div>
                                    <p className="font-semibold text-gray-900">Thành viên</p>
                                    <p className="text-xs text-gray-500">Nhấn để xem chi tiết</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="p-2 bg-blue-100 rounded-lg hover:bg-blue-200 transition-colors">
                                    <Edit3 className="w-4 h-4 text-blue-600" />
                                </button>
                                <button className="p-2 bg-red-100 rounded-lg hover:bg-red-200 transition-colors">
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Action Description */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                            <div className="flex items-center gap-2 mb-1">
                                <Edit3 className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-semibold text-blue-900">Chỉnh sửa</span>
                            </div>
                            <p className="text-xs text-gray-600">Sửa thông tin thành viên</p>
                        </div>
                        <div className="bg-red-50 rounded-lg p-3 border border-red-200">
                            <div className="flex items-center gap-2 mb-1">
                                <Trash2 className="w-4 h-4 text-red-600" />
                                <span className="text-sm font-semibold text-red-900">Xóa</span>
                            </div>
                            <p className="text-xs text-gray-600">Xóa thành viên khỏi cây</p>
                        </div>
                    </div>
                </div>
            )
        },
        {
            id: 6,
            title: 'Mẹo hữu ích',
            content: [
                'Kéo thả thành viên để sắp xếp lại vị trí',
                'Dùng thanh tìm kiếm để tìm thành viên nhanh',
                'Sử dụng zoom để xem cây gia đình lớn',
                'Chế độ toàn màn hình để xem tốt hơn'
            ],
            visual: (
                <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                        <Search className="w-8 h-8 text-purple-600 mb-2" />
                        <p className="text-sm font-semibold text-purple-900">Tìm kiếm</p>
                        <p className="text-xs text-gray-600 mt-1">Tìm thành viên nhanh chóng</p>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                        <ZoomIn className="w-8 h-8 text-green-600 mb-2" />
                        <p className="text-sm font-semibold text-green-900">Zoom</p>
                        <p className="text-xs text-gray-600 mt-1">Phóng to/thu nhỏ cây</p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <Maximize2 className="w-8 h-8 text-blue-600 mb-2" />
                        <p className="text-sm font-semibold text-blue-900">Toàn màn hình</p>
                        <p className="text-xs text-gray-600 mt-1">Xem ở chế độ rộng</p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                        <Users className="w-8 h-8 text-orange-600 mb-2" />
                        <p className="text-sm font-semibold text-orange-900">Kéo thả</p>
                        <p className="text-xs text-gray-600 mt-1">Sắp xếp vị trí thành viên</p>
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
                        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6">
                            {currentSlideData.visual}
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
                                        {text.startsWith('1.') || text.startsWith('2.') || text.startsWith('3.') || text.startsWith('4.') ? text[0] : '✓'}
                                    </div>
                                    <p className="text-gray-700 leading-relaxed">{text.replace(/^\d\.\s*/, '')}</p>
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
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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

export default FamilyTreeTutorial;
