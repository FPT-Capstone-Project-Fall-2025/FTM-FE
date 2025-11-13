import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Users, Calendar, Scroll, X, Plus, Image as ImageIcon, Loader2 } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { toast } from 'react-toastify';
import familytreeService from '@/services/familyTreeService';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { setAvailableFamilyTrees, setSelectedFamilyTree } from '@/stores/slices/familyTreeMetaDataSlice';
import type { FamilytreeCreationProps } from '@/types/familytree';
import { useNavigate } from 'react-router-dom';

const FamilyTreeSelection: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const availableFamilyTrees = useAppSelector(state => state.familyTreeMetaData.availableFamilyTrees);
    const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [apiLoading, setApiLoading] = useState(false);
    const [showCreatePopup, setShowCreatePopup] = useState(false);

    const [newTreeData, setNewTreeData] = useState<FamilytreeCreationProps>({
        name: '',
        ownerName: '',
        ownerId: '',
        description: '',
        file: null,
        gpModecode: 0,
    });
    const [tempImage, setTempImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
        fetchFamilyTrees();
    }, []);

    const fetchFamilyTrees = async () => {
        try {
            setLoading(true);
            const response = await familytreeService.getMyFamilytrees();
            dispatch(setAvailableFamilyTrees(response.data.data));
        } catch (error) {
            console.error('Error fetching family trees:', error);
            toast.error('Không thể tải danh sách gia phả');
        } finally {
            setLoading(false);
        }
    };

    const handleSelectTree = (treeId: string) => {
        setSelectedTreeId(treeId);
        const selectedTree = availableFamilyTrees.find(tree => tree.id === treeId);
        if (selectedTree) dispatch(setSelectedFamilyTree(selectedTree));
        navigate(`/family-trees/${treeId}`)
    };

    const openFileSelector = () => fileInputRef.current?.click();

    const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            toast.error('Kích thước file không được vượt quá 2MB');
            return;
        }

        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
        ];
        if (!allowedTypes.includes(file.type)) {
            toast.error('Chỉ chấp nhận file định dạng JPEG, JPG, PNG, GIF');
            return;
        }

        setNewTreeData(pre => ({
            ...pre,
            file: file
        }));

        const reader = new FileReader();
        reader.onload = e => {
            setTempImage(e.target?.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSaveNewTree = async () => {
        if (!newTreeData.name 
            // || !newTreeData.ownerName
            ) {
            toast.error('Vui lòng nhập đầy đủ tên và chủ sở hữu.');
            return;
        }
        try {
            setApiLoading(true);
            const response = await familytreeService.createFamilyTree({
                name: newTreeData.name,
                ownerName: newTreeData.ownerName,
                ownerId: 'ec9eb501-123a-4cef-a2ad-cba7353246c7',
                description: newTreeData.description,
                file: newTreeData.file,
                gpModecode: 0
            });
            toast.success(response.message);
            
            await fetchFamilyTrees();
            
            setShowCreatePopup(false);
            setTempImage(null);
            setNewTreeData({ name: '', ownerName: '', ownerId: '', description: '', file: null, gpModecode: 0 });
        } catch (err: any) {
            toast.error(err?.response?.data?.message || 'Có lỗi xảy ra khi tạo gia phả');
        } finally {
            setApiLoading(false);
        }
    };

    const handleCancelCreate = () => {
        setShowCreatePopup(false);
        setTempImage(null);
        setNewTreeData({ name: '', ownerName: '', ownerId: '', description: '', file: null, gpModecode: 0 });
    };

    const renderSkeletonCard = (count: number) =>
        Array.from({ length: count }).map((_, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden transition-all duration-300 animate-pulse">
                <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100">
                    <Skeleton height="100%" />
                </div>
                <div className="p-6 space-y-3">
                    <Skeleton height={24} width="70%" />
                    <Skeleton height={16} width="50%" />
                    <div className="flex gap-2 items-center">
                        <Skeleton circle height={24} width={24} />
                        <Skeleton height={14} width="60%" />
                    </div>
                    <Skeleton height={14} width="80%" />
                    <Skeleton height={14} width="50%" />
                </div>
            </div>
        ));

    return (
        <div className="h-full w-full bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/30 overflow-y-auto">
            <div className="mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {/* Header */}
                <div className="mb-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                            <Users className="w-8 h-8 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                GIA PHẢ CỦA TÔI
                            </h2>
                            <p className="text-gray-600 mt-1.5">Chọn một gia phả để xem và chỉnh sửa thông tin của bạn</p>
                        </div>
                    </div>
                </div>

                {/* Family Trees Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {renderSkeletonCard(6)}
                    </div>
                ) : availableFamilyTrees.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center mb-6">
                            <Users className="w-12 h-12 text-blue-500" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Chưa có gia phả nào</h3>
                        <p className="text-gray-600 mb-6 text-center max-w-md">Bắt đầu tạo gia phả đầu tiên của bạn để quản lý thông tin gia đình</p>
                        <button
                            onClick={() => setShowCreatePopup(true)}
                            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2 font-medium"
                        >
                            <Plus className="w-5 h-5" />
                            Tạo gia phả mới
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                        {availableFamilyTrees.map((tree) => (
                            <div
                                key={tree.id}
                                onClick={() => handleSelectTree(tree.id)}
                                className={`group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-2 overflow-hidden transform hover:-translate-y-1 ${
                                    selectedTreeId === tree.id
                                        ? 'border-blue-500 ring-4 ring-blue-200 shadow-xl'
                                        : 'border-gray-200 hover:border-blue-300'
                                }`}
                            >
                                <div className="h-52 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 relative overflow-hidden">
                                    {tree.filePath ? (
                                        <img
                                            src={tree.filePath}
                                            alt={tree.name}
                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                                const fallback = e.currentTarget.parentElement?.querySelector('.image-fallback');
                                                if (fallback) {
                                                    (fallback as HTMLElement).style.display = 'flex';
                                                }
                                            }}
                                        />
                                    ) : null}
                                    <div 
                                        className={`image-fallback w-full h-full flex items-center justify-center ${tree.filePath ? 'hidden' : ''}`}
                                    >
                                        <Users className="w-24 h-24 text-blue-400 group-hover:scale-110 transition-transform duration-300" />
                                    </div>
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                                </div>
                                <div className="p-6">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors truncate">
                                                {tree.name}
                                            </h3>
                                            <p className="text-sm text-gray-500">Chủ sở hữu: <span className="font-medium text-gray-700">{tree.owner}</span></p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200" />
                                    </div>
                                    <div className="space-y-3 pt-3 border-t border-gray-100">
                                        <div className="flex items-center gap-3 flex-wrap">
                                            <span className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border border-blue-200">
                                                {tree.owner}
                                            </span>
                                            <span className="flex items-center gap-1.5 text-sm text-gray-600">
                                                <Users className="w-4 h-4 text-blue-500" />
                                                <span className="font-medium">{tree.memberCount}</span>
                                                <span>thành viên</span>
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Calendar className="w-4 h-4 text-gray-400" />
                                            <span>Tạo ngày {tree.createAt}</span>
                                        </div>
                                        {tree.description && (
                                            <div className="flex items-start gap-2 text-sm text-gray-600 line-clamp-2">
                                                <Scroll className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                                <span className="line-clamp-2">{tree.description}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* Add New Family Tree Card */}
                        <div
                            onClick={() => setShowCreatePopup(true)}
                            className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-500 flex items-center justify-center min-h-[380px] transform hover:-translate-y-1 hover:scale-[1.02]"
                        >
                            <div className="text-center p-8">
                                <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:from-blue-200 group-hover:to-indigo-200 transition-all duration-300 shadow-lg group-hover:shadow-xl">
                                    <Plus className="w-10 h-10 text-blue-600 group-hover:scale-110 transition-transform duration-300" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                    Tạo gia phả mới
                                </h3>
                                <p className="text-sm text-gray-600 max-w-[200px] mx-auto">
                                    Bắt đầu xây dựng cây gia đình của bạn
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Create family tree modal */}
            {showCreatePopup && (
                <div 
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
                    onClick={handleCancelCreate}
                >
                    <div 
                        className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full relative mx-4 max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="sticky z-50 top-0 bg-gradient-to-r from-blue-600 to-indigo-600 p-6 rounded-t-2xl">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                                        <Users className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-white">Tạo gia phả mới</h2>
                                        <p className="text-sm text-blue-100 mt-0.5">Nhập thông tin để khởi tạo cây gia đình của bạn</p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleCancelCreate}
                                    className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-lg transition-all duration-200"
                                    aria-label="Đóng"
                                >
                                    <X className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6">

                            {/* Image Preview */}
                            <div className="mb-6">
                                <label className="block text-sm font-semibold text-gray-700 mb-3">
                                    Hình ảnh gia phả <span className="text-gray-400 font-normal">(Tùy chọn)</span>
                                </label>
                                <div
                                    onClick={openFileSelector}
                                    className="border-2 border-dashed border-gray-300 rounded-xl aspect-video flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50/50 transition-all duration-200 relative overflow-hidden group"
                                >
                                    {tempImage ? (
                                        <>
                                            <img
                                                src={tempImage.toString()}
                                                alt="Preview"
                                                className="w-full h-full object-cover absolute inset-0"
                                                onError={(e) => {
                                                    e.currentTarget.style.display = 'none';
                                                    const fallback = e.currentTarget.parentElement?.querySelector('.preview-fallback');
                                                    if (fallback) {
                                                        (fallback as HTMLElement).style.display = 'flex';
                                                    }
                                                }}
                                            />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                                                <div className="bg-white rounded-lg p-3 shadow-lg">
                                                    <ImageIcon className="w-6 h-6 text-blue-600" />
                                                </div>
                                            </div>
                                            <div className="preview-fallback hidden w-full h-full absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                                                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center mb-3">
                                                    <ImageIcon className="w-8 h-8 text-blue-500" />
                                                </div>
                                                <p className="text-sm font-medium text-gray-700">Không thể hiển thị ảnh</p>
                                                <p className="text-xs text-gray-500 mt-1">Nhấn để chọn lại</p>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3">
                                            <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                                                <ImageIcon className="w-8 h-8 text-blue-500" />
                                            </div>
                                            <div className="text-center">
                                                <p className="text-sm font-medium text-gray-700 group-hover:text-blue-600 transition-colors">
                                                    Nhấn để chọn ảnh
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">JPG, PNG, GIF tối đa 2MB</p>
                                            </div>
                                        </div>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageSelect}
                                        className="hidden"
                                    />
                                </div>
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                                        Tên Gia Phả <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={newTreeData.name}
                                        onChange={(e) => setNewTreeData({ ...newTreeData, name: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                                        placeholder="Nhập tên gia phả (ví dụ: Gia phả họ Nguyễn)"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2.5">
                                        Mô tả / Ghi chú <span className="text-gray-400 font-normal">(Tùy chọn)</span>
                                    </label>
                                    <textarea
                                        value={newTreeData.description}
                                        onChange={(e) => setNewTreeData({ ...newTreeData, description: e.target.value })}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none transition-all duration-200 text-gray-900 placeholder-gray-400"
                                        rows={4}
                                        placeholder="Nhập mô tả hoặc ghi chú về gia phả (ví dụ: Gia phả họ Nguyễn làng X, tỉnh Y...)"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                                <button
                                    onClick={handleCancelCreate}
                                    disabled={apiLoading}
                                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-medium rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Hủy
                                </button>
                                <button
                                    onClick={handleSaveNewTree}
                                    disabled={apiLoading}
                                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {apiLoading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span>Đang tạo...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Plus className="w-5 h-5" />
                                            <span>Tạo gia phả</span>
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FamilyTreeSelection;