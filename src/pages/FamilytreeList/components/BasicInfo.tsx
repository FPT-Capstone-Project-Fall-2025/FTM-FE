import { useAppDispatch, useAppSelector } from "@/hooks/redux";
import familyTreeService from "@/services/familyTreeService";
import { removeFamilyTree, setSelectedFamilyTree } from "@/stores/slices/familyTreeMetaDataSlice";
import type { FamilytreeUpdateProps } from "@/types/familytree";
import { Edit2 } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const BasicInfo: React.FC = () => {

    const selectedTree = useAppSelector(state => state.familyTreeMetaData.selectedFamilyTree);

    const [formData, setFormData] = useState<FamilytreeUpdateProps>({
        Name: selectedTree?.name || '',
        OwnerId: selectedTree?.ownerId || '',
        Description: selectedTree?.description || '',
        GPModeCode: selectedTree?.gpModeCode || 0,
    });
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [currentImage, setCurrentImage] = useState<string>(selectedTree?.filePath || '');
    const [isEditMode, setIsEditMode] = useState(false);
    const [showImagePopup, setShowImagePopup] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [tempFile, setTempFile] = useState<File | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const hasChanges = () => {
        return (
            formData.Name !== (selectedTree?.name || '') ||
            formData.OwnerId !== (selectedTree?.ownerId || '') ||
            formData.Description !== (selectedTree?.description || '') ||
            tempFile !== null
        );
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        // Reset to original values from selectedTree
        setFormData({
            Name: selectedTree?.name || '',
            OwnerId: selectedTree?.ownerId || '',
            Description: selectedTree?.description || '',
            GPModeCode: selectedTree?.gpModeCode || 0,
        });
        setCurrentImage(selectedTree?.filePath || '');
        setTempFile(null);
        setTempImage(null);
        setIsEditMode(false);
    };

    const handleSave = async () => {
        if (!hasChanges()) {
            setIsEditMode(false);
            return;
        }

        setIsSaving(true);
        try {
            const updateData: FamilytreeUpdateProps = {
                Name: formData.Name,
                OwnerId: formData.OwnerId,
                Description: formData.Description,
                GPModeCode: formData.GPModeCode,
            };

            if (tempFile) {
                updateData.File = tempFile;
            }

            const response = await familyTreeService.updateFamilyTree(selectedTree?.id || '', updateData);

            toast.success('Cập nhật gia phả thành công!');

            // Update Redux state
            dispatch(setSelectedFamilyTree(response.data));

            // Update local states
            if (tempFile && tempImage) {
                setCurrentImage(tempImage);
            }

            setIsEditMode(false);
            setTempFile(null);
            setTempImage(null);

        } catch (error: any) {
            console.error('Error saving:', error);
            toast.error(error?.message || 'Có lỗi xảy ra khi cập nhật!');
        } finally {
            setIsSaving(false);
        }
    };


    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
            if (!validTypes.includes(file.type)) {
                toast.error('Định dạng file không hợp lệ. Vui lòng chọn file JPG, JPEG, PNG hoặc GIF.');
                return;
            }

            // Validate file size (25MB)
            const maxSize = 25 * 1024 * 1024; // 25MB in bytes
            if (file.size > maxSize) {
                toast.error('Kích thước file vượt quá 25MB. Vui lòng chọn file nhỏ hơn.');
                return;
            }

            // Read file and create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setTempImage(reader.result as string);
                setTempFile(file);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleImageSave = () => {
        // Just close the popup, the tempFile and tempImage are already set
        // They will be used when the main form is saved
        setShowImagePopup(false);
    };

    const handleImageDelete = () => {
        setTempImage(null);
        setTempFile(null);
        setCurrentImage('');
    };

    const handleImagePopupCancel = () => {
        // Reset temp states if user cancels without saving
        if (!hasChanges()) {
            setTempImage(null);
            setTempFile(null);
        }
        setShowImagePopup(false);
    };

    const openFileSelector = () => {
        fileInputRef.current?.click();
    };

    const handleDelete = async () => {
        if (!selectedTree?.id) {
            toast.error('Không tìm thấy gia phả để xóa!');
            return;
        }

        try {
            const response = await familyTreeService.deleteFamilyTree(selectedTree.id);
            toast.success(response.message);
            setShowDeleteConfirm(false);
            navigate('/family-trees');
            dispatch(removeFamilyTree(selectedTree.id));

        } catch (error: any) {
            console.error('Error deleting:', error);
            toast.error(error?.message || 'Có lỗi xảy ra khi xóa gia phả!');
        }
    };

    // Display priority: tempImage (new upload) > currentImage (saved)
    const displayImage = tempImage || currentImage;

    return (
        <div className="h-full overflow-y-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Family Tree Image */}
                <div className="lg:col-span-1">
                    <div
                        onClick={() => isEditMode && setShowImagePopup(true)}
                        className={`bg-white rounded-lg border-2 border-dashed border-gray-300 aspect-square flex items-center justify-center transition-colors relative group overflow-hidden ${isEditMode ? 'cursor-pointer hover:border-blue-500' : 'cursor-default'
                            }`}
                    >
                        {displayImage ? (
                            <>
                                <img
                                    src={displayImage}
                                    alt="Family tree"
                                    className="w-full h-full object-cover"
                                />
                                {isEditMode && (
                                    <div className="absolute inset-0 bg-black/30 bg-opacity-0 group-hover:bg-opacity-40 transition-all flex items-center justify-center">
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
                                    <div className="absolute inset-0 bg-gray-100 bg-opacity-0 group-hover:bg-opacity-50 rounded-lg transition-all flex items-center justify-center">
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
                        <label htmlFor="Name" className="block text-sm font-medium text-gray-700 mb-2">
                            Tên Gia Phả
                        </label>
                        <input
                            type="text"
                            id="Name"
                            name="Name"
                            value={formData.Name}
                            onChange={handleChange}
                            disabled={!isEditMode}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${!isEditMode ? 'bg-gray-50 cursor-not-allowed' : ''
                                }`}
                            placeholder="Nhập tên gia phả"
                        />
                    </div>

                    <div>
                        <label htmlFor="OwnerId" className="block text-sm font-medium text-gray-700 mb-2">
                            Mã người sở hữu
                        </label>
                        <input
                            type="text"
                            id="OwnerId"
                            name="OwnerId"
                            value={formData.OwnerId}
                            onChange={handleChange}
                            disabled={!isEditMode}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all ${!isEditMode ? 'bg-gray-50 cursor-not-allowed' : ''
                                }`}
                            placeholder="Nhập mã người sở hữu"
                        />
                    </div>

                    <div>
                        <label htmlFor="Description" className="block text-sm font-medium text-gray-700 mb-2">
                            Ghi chú khác
                        </label>
                        <textarea
                            id="Description"
                            name="Description"
                            value={formData.Description}
                            onChange={handleChange}
                            disabled={!isEditMode}
                            rows={6}
                            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none ${!isEditMode ? 'bg-gray-50 cursor-not-allowed' : ''
                                }`}
                            placeholder="Nhập ghi chú"
                        />
                    </div>

                    <div className="flex gap-3 justify-end pt-4">
                        {!isEditMode ? (
                            <>
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteConfirm(true)}
                                    className="px-6 py-2 border border-red-500 text-red-500 rounded-lg font-medium hover:bg-red-50 transition-colors"
                                >
                                    Xóa gia phả
                                </button>
                                <button
                                    type="button"
                                    onClick={handleEdit}
                                    className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors"
                                >
                                    Chỉnh sửa
                                </button>
                            </>
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
                                    disabled={!hasChanges() || isSaving}
                                    className={`px-6 py-2 rounded-lg font-medium transition-colors ${hasChanges() && !isSaving
                                        ? 'bg-blue-500 text-white hover:bg-blue-600'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    {isSaving ? 'Đang lưu...' : 'Lưu'}
                                </button>

                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Upload Popup */}
            {showImagePopup && (
                <div className="fixed inset-0 bg-black/50 bg-opacity-60 flex items-center justify-center z-50">
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
                        {displayImage && (
                            <div className="mb-4 rounded-lg overflow-hidden border border-gray-200">
                                <img src={displayImage} alt="Preview" className="w-full h-48 object-cover" />
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

                            {displayImage && (
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

            {/* Delete Confirmation Popup */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 bg-opacity-60 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <div className="flex items-center justify-center w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full">
                            <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>

                        <h2 className="text-xl font-semibold text-center mb-2">Xác nhận xóa gia phả</h2>
                        <p className="text-sm text-gray-600 text-center mb-6">
                            Bạn có chắc chắn muốn xóa gia phả <span className="font-semibold">"{selectedTree?.name}"</span>?
                            <br />
                            Hành động này không thể hoàn tác!
                        </p>

                        <div className="flex gap-3 justify-end">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleDelete}
                                className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BasicInfo;