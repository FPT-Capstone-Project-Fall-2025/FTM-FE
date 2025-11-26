import React, { useState, useEffect } from 'react';
import { Edit2, Trash2, Plus, Sparkles, Calendar } from 'lucide-react';
import type { BiographyEntry } from '@/types/biography';
import biographyService from '@/services/biographyService';
import { toast } from 'react-toastify';
import CustomDatePicker from '@/components/ui/DatePicker';
import BioAndEventsSkeleton from '@/components/skeleton/BioAndEventsSkeleton';

const Biography: React.FC = () => {

    const [isLoading, setIsLoading] = useState(false);
    const [entries, setEntries] = useState<BiographyEntry[]>([]);
    const [originalEntries, setOriginalEntries] = useState<BiographyEntry[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [initialLoading, setInitialLoading] = useState(false);
    const [bioDescription, setBioDescription] = useState<string>('');
    const [originalBioDescription, setOriginalBioDescription] = useState<string>('');

    const [newEntry, setNewEntry] = useState<BiographyEntry>({
        id: '',
        title: '',
        description: '',
        eventDate: '',
    });

    const [editEntry, setEditEntry] = useState<BiographyEntry>({
        id: '',
        title: '',
        description: '',
        eventDate: '',
    });

    useEffect(() => {
        const fetchInitData = async () => {
            setInitialLoading(true);
            const [bioDesc, entries] = await Promise.all([
                biographyService.getBiographyDesc(),
                biographyService.getBiographyEvents()
            ]);
            setOriginalBioDescription(bioDesc.data.description);
            setBioDescription(bioDesc.data.description);
            setOriginalEntries(entries.data);
            setEntries(entries.data);
            setInitialLoading(false);
        }
        fetchInitData();
    }, []);

    const hasChanges = () => {
        return JSON.stringify(entries) !== JSON.stringify(originalEntries) ||
            bioDescription !== originalBioDescription;
    };

    const hasActiveEditing = () => {
        return editingId !== null;
    };

    const handleAddClick = () => {
        setNewEntry({
            id: '',
            title: '',
            description: '',
            eventDate: ''
        });
        setShowAddModal(true);
    };

    const handleAddEntry = async () => {
        if (!newEntry.title || !newEntry.eventDate) {
            alert('Vui lòng điền đầy đủ thông tin!');
            return;
        }

        const entry: BiographyEntry = {
            ...newEntry,
            id: Date.now().toString()
        };

        try {
            const response = await biographyService.addBiographyEvent(entry);
            toast.success(response.message)
        } catch (error) {
            console.log(error);
        } finally {
            setShowAddModal(false);
        }
        setEntries([...entries, entry]);
    };

    const handleEditClick = (entry: BiographyEntry) => {
        setEditEntry({ ...entry });
        setShowEditModal(true);
    };

    const handleUpdateEntry = async () => {
        if (!editEntry.title || !editEntry.eventDate) {
            alert('Vui lòng điền đầy đủ thông tin!');
            return;
        }
        try {
            await biographyService.updateBiographyEvent(editEntry);
            setEntries(prev =>
                prev.map(entry => entry.id === editEntry.id ? editEntry : entry)
            );
        } catch (error) {
            console.log(error);
        } finally {
            setShowEditModal(false);
            toast.success('Chỉnh sửa thông tin thành công');
        }
    };

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        try {
            await biographyService.deleteBiographyEvent(deleteId);
            setEntries(prev => prev.filter(entry => entry.id !== deleteId));
            if (editingId === deleteId) {
                setEditingId(null);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setShowDeleteConfirm(false);
            setDeleteId(null);
            toast.success('Xóa thành công!');
        }
    };

    const handleCancel = () => {
        if (hasActiveEditing() || hasChanges()) {
            setEditingId(null);
            setEntries(originalEntries);
            setBioDescription(originalBioDescription);
        }
    };

    const handleSave = async () => {
        setEditingId(null);
        setIsLoading(true);
        try {
            const res = await biographyService.updateBiographyDesc(bioDescription);
            if (res.data) {
                setOriginalBioDescription(res.data.description);
            }
        } catch (error) {
            console.log(error);
        } finally {
            setEditingId(null);
            setIsLoading(false);
            toast.success('Cập nhật thông tin thành công!');
        }
    };

    if (initialLoading) {
        return <BioAndEventsSkeleton />
    }

    return (
        <>
            {/* Main Card with Premium Design */}
            <div className="relative p-6 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 rounded-xl shadow-xl backdrop-blur-sm border border-gray-200/50">

                {/* Bio Description Section */}
                <div className="mb-8 p-6 bg-white/80 backdrop-blur-sm rounded-xl shadow-md border border-blue-100">
                    <h3 className="text-lg font-bold mb-3 text-gray-800 flex items-center gap-2">
                        <Sparkles size={20} className="text-blue-500" />
                        Tiểu sử
                    </h3>
                    <textarea
                        value={bioDescription ? bioDescription : ''}
                        onChange={(e) => setBioDescription(e.target.value)}
                        className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-sm transition-all duration-200 resize-none h-24"
                        placeholder="Hãy nhập mô tả tiểu sử ở đây..."
                    />
                </div>

                {/* Events Section with Timeline */}
                <div>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                            <Calendar size={22} className="text-purple-500" />
                            Sự kiện
                        </h3>
                        <button
                            onClick={handleAddClick}
                            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-700 shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                        >
                            <Plus size={18} />
                            THÊM SỰ KIỆN
                        </button>
                    </div>

                    {/* Timeline */}
                    <div className="relative pl-8 border-l-4 border-blue-300 space-y-8">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 via-purple-400 to-pink-400 rounded-full -translate-x-1/2"></div>

                        {entries.length === 0 ? (
                            <div className="text-center text-gray-500 italic py-10">
                                <Sparkles size={48} className="mx-auto mb-4 text-blue-300" />
                                <p>Chưa có sự kiện nào. Hãy thêm sự kiện đầu tiên!</p>
                            </div>
                        ) : (
                            entries.map((entry, index) => (
                                <div
                                    key={entry.id}
                                    className="relative group transform transition-all duration-500 ease-out animate-slideInLeft"
                                    style={{ animationDelay: `${index * 0.1}s` }}
                                >
                                    {/* Timeline Node */}
                                    <div className="absolute -left-10 top-0 mt-2 w-6 h-6 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full border-4 border-white shadow-lg group-hover:scale-125 transition-transform duration-300"></div>

                                    {/* Event Card */}
                                    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 shadow-lg border border-blue-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 group-hover:border-blue-300">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1">
                                                {/* Date Badge */}
                                                <div className="inline-flex items-center gap-2 px-3 py-1 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full mb-3">
                                                    <Calendar size={14} className="text-blue-600" />
                                                    <span className="text-xs font-semibold text-blue-700">
                                                        {new Date(entry.eventDate).toLocaleDateString('vi-VN', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                </div>

                                                {/* Title */}
                                                <h4 className="font-bold text-lg mb-2 text-gray-800 group-hover:text-blue-600 transition-colors">
                                                    {entry.title}
                                                </h4>

                                                {/* Description */}
                                                {entry.description && (
                                                    <p className="text-sm text-gray-700 leading-relaxed pl-4 border-l-2 border-blue-200">
                                                        {entry.description}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Action Buttons */}
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => handleEditClick(entry)}
                                                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200 cursor-pointer"
                                                    title="Chỉnh sửa"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(entry.id)}
                                                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-all duration-200 cursor-pointer"
                                                    title="Xóa"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 mt-8 pt-6 border-t-2 border-gray-200">
                    <button
                        onClick={handleCancel}
                        disabled={!hasChanges()}
                        className={`px-8 py-3 font-semibold border-2 border-gray-300 rounded-xl transition-all duration-200 ${hasChanges()
                            ? 'hover:bg-white hover:shadow-lg cursor-pointer'
                            : 'opacity-50 cursor-not-allowed'
                            }`}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges() || isLoading}
                        className={`px-8 py-3 font-semibold rounded-xl text-white transition-all duration-200 ${hasChanges() && !isLoading
                            ? 'bg-gradient-to-r from-gray-800 to-black hover:from-gray-900 hover:to-gray-800 hover:shadow-xl hover:-translate-y-1 cursor-pointer'
                            : 'bg-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {isLoading ? 'Đang lưu...' : 'Lưu'}
                    </button>
                </div>
            </div>

            {/* Add Event Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl border-2 border-gray-200 animate-scaleIn">
                        <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Thêm sự kiện mới
                        </h3>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-800">
                                    Tiêu đề <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newEntry.title}
                                    onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                                    placeholder="Nhập tiêu đề sự kiện"
                                />
                            </div>
                            <div>
                                <CustomDatePicker
                                    label="Ngày sự kiện"
                                    value={newEntry.eventDate}
                                    onChange={(date) => setNewEntry({ ...newEntry, eventDate: date })}
                                    isEditing={true}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-800">Mô tả</label>
                                <textarea
                                    value={newEntry.description}
                                    onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                                    className="w-full h-28 border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 resize-none"
                                    placeholder="Nhập mô tả sự kiện..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 mt-8 pt-6 border-t-2 border-gray-200">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-8 py-3 font-semibold border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:shadow-lg transition-all duration-200 cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAddEntry}
                                className="px-8 py-3 font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                            >
                                Thêm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Event Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl border-2 border-gray-200 animate-scaleIn">
                        <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                            Chỉnh sửa sự kiện
                        </h3>
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-800">
                                    Tiêu đề <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editEntry.title}
                                    onChange={(e) => setEditEntry({ ...editEntry, title: e.target.value })}
                                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                                    placeholder="Nhập tiêu đề sự kiện"
                                />
                            </div>
                            <div>
                                <CustomDatePicker
                                    label="Ngày sự kiện"
                                    value={editEntry.eventDate}
                                    onChange={(date) => setEditEntry({ ...editEntry, eventDate: date })}
                                    isEditing={true}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-800">Mô tả</label>
                                <textarea
                                    value={editEntry.description}
                                    onChange={(e) => setEditEntry({ ...editEntry, description: e.target.value })}
                                    className="w-full h-28 border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 resize-none"
                                    placeholder="Nhập mô tả sự kiện..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-4 mt-8 pt-6 border-t-2 border-gray-200">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-8 py-3 font-semibold border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:shadow-lg transition-all duration-200 cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleUpdateEntry}
                                className="px-8 py-3 font-semibold bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:from-blue-600 hover:to-purple-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                            >
                                Cập nhật
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border-2 border-gray-200 animate-scaleIn">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-pink-600">
                            <Trash2 size={28} className="text-white" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-center text-gray-800">Xác nhận xóa</h3>
                        <p className="text-gray-600 mb-6 text-center leading-relaxed">
                            Bạn có chắc chắn muốn xóa sự kiện này không?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-6 py-3 font-semibold border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:shadow-lg transition-all duration-200 cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-6 py-3 font-semibold bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes scaleIn {
                    from {
                        opacity: 0;
                        transform: scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
                
                .animate-scaleIn {
                    animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
            `}</style>
        </>
    );
};

export default Biography;