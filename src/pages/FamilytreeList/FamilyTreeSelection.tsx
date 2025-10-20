import React, { useState, useEffect } from 'react';
import { ChevronRight, Users, Calendar, Scroll } from 'lucide-react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import familytreeService from '@/services/familytreeService';
import { useAppDispatch, useAppSelector } from '@/hooks/redux';
import { setAvailableFamilyTrees, setSelectedFamilyTree } from '@/stores/slices/familyTreeSlice';

const FamilyTreeSelection: React.FC = () => {
    const dispatch = useAppDispatch();
    const availableFamilyTrees = useAppSelector(state => state.familyTree.availableFamilyTrees);
    const [selectedTreeId, setSelectedTreeId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFamilyTrees = async () => {
            try {
                const response = await familytreeService.getFamilytrees();
                dispatch(setAvailableFamilyTrees(response.data.data));
            } catch (error) {
                console.error('Error fetching family trees:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchFamilyTrees();
    }, []);

    const handleSelectTree = (treeId: string) => {
        setSelectedTreeId(treeId);
        const selectedTree = availableFamilyTrees.find(tree => tree.id === treeId);
        if (selectedTree) {
            dispatch(setSelectedFamilyTree(selectedTree));

            // TODO: Fetch family tree data from API
            try {
                // const response = await fetch(`/api/family-trees/${treeId}/data`);
                // const treeData = await response.json();

                // Mock data for now - you would load actual tree data here
                // dispatch(loadFamilyTreeData({
                //   treeId: treeId,
                //   nodes: treeData.nodes,
                //   edges: treeData.edges,
                //   members: treeData.members
                // }));
            } catch (error) {
                console.error('Error loading family tree data:', error);
            }
        };
    }

    const renderSkeletonCard = (count: number) =>
        Array.from({ length: count }).map((_, idx) => (
            <div
                key={idx}
                className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden"
            >
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
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        GIA PHẢ CỦA TÔI
                    </h1>
                    <p className="text-gray-600">
                        Chọn một gia phả để xem và chỉnh sửa thông tin của bạn
                    </p>
                </div>

                {/* Family Trees Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {loading
                        ? renderSkeletonCard(3)
                        : availableFamilyTrees.map((tree) => (
                            <div
                                key={tree.id}
                                onClick={() => handleSelectTree(tree.id)}
                                className={`bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border-2 ${selectedTreeId === tree.id
                                    ? 'border-blue-500 ring-2 ring-blue-200'
                                    : 'border-transparent hover:border-blue-200'
                                    }`}
                            >
                                {/* Image/Icon Section */}
                                <div className="h-48 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-t-lg flex items-center justify-center">
                                    {tree.picture ? (
                                        <img
                                            src={tree.picture}
                                            alt={tree.name}
                                            className="w-full h-full object-cover rounded-t-lg"
                                        />
                                    ) : (
                                        <Users className="w-20 h-20 text-blue-400" />
                                    )}
                                </div>

                                {/* Content Section */}
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex-1">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                                                {tree.name}
                                            </h3>
                                            <p className="text-sm text-gray-600">
                                                Chủ sở hữu: {tree.owner}
                                            </p>
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
                        <div className="bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer border-2 border-dashed border-gray-300 hover:border-blue-400 flex items-center justify-center min-h-[320px]">
                            <div className="text-center p-6">
                                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Users className="w-8 h-8 text-blue-500" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                    Tạo gia phả mới
                                </h3>
                                <p className="text-sm text-gray-600">
                                    Bắt đầu xây dựng cây gia đình của bạn
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FamilyTreeSelection;
