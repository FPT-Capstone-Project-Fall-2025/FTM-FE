import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Users, Calendar, Scroll, X } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { toast } from 'react-toastify';
import familytreeService from '@/services/familytreeService';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { setAvailableFamilyTrees, setSelectedFamilyTree } from '@/stores/slices/familyTreeMetaDataSlice';
import type { FamilytreeCreationProps } from '@/types/familytree';
import type { PaginationProps } from '@/types/api';
import { Pagination } from '@/components/ui/Pagination';

const FamilyTreeSelection: React.FC = () => {
    const dispatch = useAppDispatch();
    const availableFamilyTrees = useAppSelector(state => state.familyTreeMetaData.availableFamilyTrees);
    const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [apiLoading, setApiLoading] = useState(false);
    const [showCreatePopup, setShowCreatePopup] = useState(false);

    const [paginationData, setPaginationData] = useState<PaginationProps>({
        pageIndex: 1,
        pageSize: 7,
        totalItems: 0,
        totalPages: 0
    });

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
    }, [paginationData.pageIndex, paginationData.pageSize]);

    const fetchFamilyTrees = async () => {
        try {
            setLoading(true);
            const response = await familytreeService.getFamilytrees({
                pageIndex: paginationData.pageIndex,
                pageSize: paginationData.pageSize,
                totalItems: 0,
                totalPages: 0
            });

            dispatch(setAvailableFamilyTrees(response.data.data));
            setPaginationData({
                pageIndex: response.data.pageIndex,
                pageSize: response.data.pageSize,
                totalItems: response.data.totalItems,
                totalPages: response.data.totalPages
            });
        } catch (error) {
            console.error('Error fetching family trees:', error);
            toast.error('Không thể tải danh sách gia phả');
        } finally {
            setLoading(false);
        }
    };

    const handlePageChange = (page: number) => {
        setPaginationData(prev => ({
            ...prev,
            pageIndex: page
        }));
    };

    const handleSelectTree = (treeId: string) => {
        setSelectedTreeId(treeId);
        const selectedTree = availableFamilyTrees.find(tree => tree.id === treeId);
        if (selectedTree) dispatch(setSelectedFamilyTree(selectedTree));
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
        if (!newTreeData.name || !newTreeData.ownerName) {
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
            <div key={idx} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="h-48">
                    <Skeleton height="100%" />
                </div>
                <div className="p-5 space-y-3">
                    <Skeleton height={20} width="70%" />
                    <Skeleton height={15} width="50%" />
                    <div className="flex gap-2 items-center">
                        <Skeleton circle height={20} width={20} />
                        <Skeleton height={14} width="60%" />
                    </div>
                    <Skeleton height={14} width="80%" />
                    <Skeleton height={14} width="50%" />
                </div>
            </div>
        ));

    return (
        <div className="h-full overflow-y-auto w-full bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">GIA PHẢ CỦA TÔI</h1>
                    <p className="text-gray-600">Chọn một gia phả để xem và chỉnh sửa thông tin của bạn</p>
                </div>

                {/* Family Trees Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {loading
                        ? renderSkeletonCard(paginationData.pageSize)
                        : availableFamilyTrees.map((tree) => (
                            <div
                                key={tree.id}
                                onClick={() => handleSelectTree(tree.id)}
                                className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border-2 ${selectedTreeId === tree.id
                                    ? 'border-blue-500 ring-2 ring-blue-200'
                                    : 'border-transparent hover:border-blue-200'
                                    }`}
                            >
                                <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-t-lg flex items-center justify-center">
                                    {tree.filePath ? (
                                        <img
                                            src={tree.filePath}
                                            alt={tree.name}
                                            className="w-full h-full object-cover rounded-t-lg"
                                        />
                                    ) : (
                                        <Users className="w-20 h-20 text-blue-400" />
                                    )}
                                </div>
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">{tree.name}</h3>
                                            <p className="text-sm text-gray-600">Chủ sở hữu: {tree.owner}</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" />
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <span className="px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                                {tree.owner}
                                            </span>
                                            <span className="text-gray-400">•</span>
                                            <span>{tree.memberCount} thành viên</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Calendar className="w-4 h-4" />
                                            <span>Tạo ngày {tree.createAt}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-gray-500">
                                            <Scroll className="w-4 h-4" />
                                            <span>{tree.description}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                    {/* Add New Family Tree Card */}
                    {!loading && (
                        <div
                            onClick={() => setShowCreatePopup(true)}
                            className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-400 flex items-center justify-center min-h-[320px]"
                        >
                            <div className="text-center p-6">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-blue-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Tạo gia phả mới</h3>
                                <p className="text-sm text-gray-600">Bắt đầu xây dựng cây gia đình của bạn</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Pagination Component */}
                {!loading && paginationData.totalPages > 1 && (
                    <Pagination
                        pageIndex={paginationData.pageIndex}
                        pageSize={paginationData.pageSize}
                        totalItems={paginationData.totalItems}
                        totalPages={paginationData.totalPages}
                        onPageChange={handlePageChange}
                    />
                )}
            </div>

            {/* Create family tree modal */}
            {showCreatePopup && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-lg w-full relative mx-4">
                        <button
                            onClick={handleCancelCreate}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <h2 className="text-2xl font-semibold mb-4 text-gray-900">Tạo gia phả mới</h2>
                        <p className="text-gray-500 mb-6">Nhập thông tin để khởi tạo cây gia đình của bạn</p>

                        {/* Image Preview */}
                        <div
                            onClick={openFileSelector}
                            className="border-2 border-dashed rounded-lg aspect-video flex items-center justify-center mb-6 cursor-pointer hover:border-blue-400 transition-colors relative"
                        >
                            {tempImage ? (
                                <img
                                    src={tempImage.toString()}
                                    alt="Preview"
                                    className="w-full h-full object-cover rounded-lg"
                                />
                            ) : (
                                <Users className="w-16 h-16 text-gray-400" />
                            )}
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleImageSelect}
                                className="hidden"
                            />
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Tên Gia Phả</label>
                                <input
                                    type="text"
                                    value={newTreeData.name}
                                    onChange={(e) => setNewTreeData({ ...newTreeData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Nhập tên gia phả"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Chủ Sở Hữu</label>
                                <input
                                    type="text"
                                    value={newTreeData.ownerName}
                                    onChange={(e) => setNewTreeData({ ...newTreeData, ownerName: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                    placeholder="Nhập tên chủ sở hữu"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Ghi Chú</label>
                                <textarea
                                    value={newTreeData.description}
                                    onChange={(e) => setNewTreeData({ ...newTreeData, description: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                    rows={4}
                                    placeholder="Nhập mô tả hoặc ghi chú"
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={handleCancelCreate}
                                className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSaveNewTree}
                                disabled={apiLoading}
                                className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {apiLoading ? 'Đang lưu...' : 'Lưu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default FamilyTreeSelection;