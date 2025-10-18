import { Edit2 } from "lucide-react";
import { useState, useRef } from "react";

const BasicInfo = () => {
    const [formData, setFormData] = useState({
        familyName: 'Gia phả dòng họ X',
        founder: 'Nguyễn Văn A',
        description: ''
    });
    const [originalData, setOriginalData] = useState({
        familyName: 'Gia phả dòng họ X',
        founder: 'Nguyễn Văn A',
        description: ''
    });
    const [currentImage, setCurrentImage] = useState(null);
    const [originalImage, setOriginalImage] = useState(null);
    const [isEditMode, setIsEditMode] = useState(false);
    const [showImagePopup, setShowImagePopup] = useState(false);
    const [tempImage, setTempImage] = useState(null);
    const fileInputRef = useRef(null);
        
    const hasChanges = () => {
        return (
            formData.familyName !== originalData.familyName ||
            formData.founder !== originalData.founder ||
            formData.description !== originalData.description ||
            currentImage !== originalImage
        );
    };

    const handleChange = (e : React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (!isEditMode) return;
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleEdit = () => {
        setIsEditMode(true);
    };

    const handleCancel = () => {
        setFormData(originalData);
        setCurrentImage(originalImage);
        setIsEditMode(false);
    };

    const handleSave = async () => {
        if (!hasChanges()) return;
        
        // TODO: Implement API call here
        console.log('Saving data:', {
            formData,
            image: currentImage
        });
        
        // After successful API call, update original data
        setOriginalData(formData);
        setOriginalImage(currentImage);
        setIsEditMode(false);
        
        // Example API call structure:
        /*
        try {
            const response = await fetch('/api/family-tree', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    familyName: formData.familyName,
                    founder: formData.founder,
                    description: formData.description,
                    image: currentImage
                })
            });
            
            if (response.ok) {
                setOriginalData(formData);
                setOriginalImage(currentImage);
                setIsEditMode(false);
            }
        } catch (error) {
            console.error('Error saving:', error);
        }
        */
    };

    const handleImageSelect = (e : any) => {
        const file = e.target.files[0];
        if (file) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                alert('Định dạng file không hợp lệ. Vui lòng chọn file JPG, JPEG, PNG hoặc GIF.');
                return;
            }
            
            // Validate file size (25MB)
            const maxSize = 25 * 1024 * 1024; // 25MB in bytes
            if (file.size > maxSize) {
                alert('Kích thước file vượt quá 25MB. Vui lòng chọn file nhỏ hơn.');
                return;
            }

            // Read file and create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempImage(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageSave = () => {
        if (tempImage) {
            setCurrentImage(tempImage);
        }
        setShowImagePopup(false);
        setTempImage(null);
        
        // TODO: Upload image to server
        /*
        const formData = new FormData();
        formData.append('image', fileInputRef.current.files[0]);
        
        try {
            const response = await fetch('/api/upload-image', {
                method: 'POST',
                body: formData
            });
            
            if (response.ok) {
                const data = await response.json();
                setCurrentImage(data.imageUrl);
            }
        } catch (error) {
            console.error('Error uploading image:', error);
        }
        */
    };

    const handleImageDelete = () => {
        setTempImage(null);
        if (showImagePopup) {
            // If in popup, just clear temp image
            setTempImage(null);
        } else {
            // If not in popup, clear current image
            setCurrentImage(null);
        }
        
        // TODO: Delete image from server
        /*
        try {
            await fetch('/api/delete-image', {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Error deleting image:', error);
        }
        */
    };

    const handleImagePopupCancel = () => {
        setTempImage(null);
        setShowImagePopup(false);
    };

    const openFileSelector = () => {
        fileInputRef.current?.click();
    };

    return (
        <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Family Tree Image */}
                <div className="lg:col-span-1">
                    <div 
                        onClick={() => isEditMode && setShowImagePopup(true)}
                        className={`bg-white rounded-lg border-2 border-dashed border-gray-300 aspect-square flex items-center justify-center transition-colors relative group overflow-hidden ${
                            isEditMode ? 'cursor-pointer hover:border-blue-500' : 'cursor-default'
                        }`}
                    >
                        {currentImage ? (
                            <>
                                <img 
                                    src={currentImage} 
                                    alt="Family tree" 
                                    className="w-full h-full object-cover"
                                />
                                {isEditMode && (
                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
                                        <Edit2 className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                )}
                            </>
                        ) : (
                            <>
                                <svg className="w-32 h-32 text-gray-400" viewBox="0 0 100 100" fill="none">
                                    <line x1="20" y1="20" x2="80" y2="80" stroke="currentColor" strokeWidth="2" />
                                    <line x1="80" y1="20" x2="20" y2="80" stroke="currentColor" strokeWidth="2" />
                                </svg>
                                {isEditMode && (
                                    <div className="absolute inset-0 bg-gray-900 bg-opacity-0 group-hover:bg-opacity-5 rounded-lg transition-all flex items-center justify-center">
                                        <Edit2 className="w-8 h-8 text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>

                {/* Form Section */}
                <div className="lg:col-span-2 space-y-6">
                    <div>
                        <label htmlFor="familyName" className="block text-sm font-medium text-gray-700 mb-2">
                            Tên Gia Phả
                        </label>
                        <input
                            type="text"
                            id="familyName"
                            name="familyName"
                            value={formData.familyName}
                            onChange={handleChange}
                            disabled={!isEditMode}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                                !isEditMode ? 'bg-gray-50 cursor-not-allowed' : ''
                            }`}
                            placeholder="Nhập tên gia phả"
                        />
                    </div>

                    <div>
                        <label htmlFor="founder" className="block text-sm font-medium text-gray-700 mb-2">
                            Người sở hữu
                        </label>
                        <input
                            type="text"
                            id="founder"
                            name="founder"
                            value={formData.founder}
                            onChange={handleChange}
                            disabled={!isEditMode}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${
                                !isEditMode ? 'bg-gray-50 cursor-not-allowed' : ''
                            }`}
                            placeholder="Nhập tên người sở hữu"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                            Ghi chú khác
                        </label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            disabled={!isEditMode}
                            rows={6}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none ${
                                !isEditMode ? 'bg-gray-50 cursor-not-allowed' : ''
                            }`}
                            placeholder="Nhập ghi chú"
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        {!isEditMode ? (
                            <button
                                type="button"
                                onClick={handleEdit}
                                className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors"
                            >
                                Chỉnh sửa
                            </button>
                        ) : (
                            <>
                                <button
                                    type="button"
                                    onClick={handleCancel}
                                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                                >
                                    Hủy
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSave}
                                    disabled={!hasChanges()}
                                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                                        hasChanges()
                                            ? 'bg-blue-500 text-white hover:bg-blue-600'
                                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    }`}
                                >
                                    Lưu
                                </button>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Upload Popup */}
            {showImagePopup && (
                <div className="fixed inset-0 bg-black/60 bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 relative">
                        <button
                            onClick={handleImagePopupCancel}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <h2 className="text-xl font-semibold mb-4">Thay đổi ảnh gia phả</h2>
                        <p className="text-sm text-gray-500 mb-2">Hãy chọn ảnh đại diện của bạn</p>
                        <p className="text-sm text-gray-400 mb-6">Định dạng: JPEG, JPG, PNG, GIF<br />Kích thước tối đa: 25MB</p>

                        {/* Image Preview */}
                        {tempImage && (
                            <div className="mb-4 rounded-lg overflow-hidden border border-gray-200">
                                <img src={tempImage} alt="Preview" className="w-full h-48 object-cover" />
                            </div>
                        )}

                        {/* Hidden file input */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/jpg,image/png,image/gif"
                            onChange={handleImageSelect}
                            className="hidden"
                        />

                        <div className="space-y-3 mb-6">
                            <button 
                                onClick={openFileSelector}
                                className="w-full px-4 py-3 border border-blue-500 text-blue-500 rounded-lg hover:bg-blue-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                Chọn ảnh
                            </button>

                            {(tempImage || currentImage) && (
                                <button 
                                    onClick={handleImageDelete}
                                    className="w-full px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Xóa ảnh hiện tại
                                </button>
                            )}
                        </div>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={handleImagePopupCancel}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleImageSave}
                                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                            >
                                LƯU
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default BasicInfo;