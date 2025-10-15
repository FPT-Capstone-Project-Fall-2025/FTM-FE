import React, { useState, useEffect } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
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
            setIsLoading(false);
            toast.success('Cập nhật thông tin thành công!');
        }
    };

    if(initialLoading) {
        return <BioAndEventsSkeleton />
    }

    return (
        <>
            {/* Main Card */}
            <div className="bg-white rounded-lg border border-gray-300 p-6">
                {/* Bio Description Section */}
                <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3">Tiểu sử</h2>
                    <input
                        type="text"
                        value={bioDescription ? bioDescription : ''}
                        onChange={(e) => setBioDescription(e.target.value)}
                        className="w-full border border-gray-300 rounded px-4 py-3 focus:outline-none focus:border-blue-500 text-sm"
                        placeholder="Hãy nhập mô tả tiểu sử ở đây..."
                    />
                </div>
                {/* Events Section */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">Sự kiện</h2>
                        <button
                            onClick={handleAddClick}
                            className="text-blue-600 text-sm flex items-center gap-1 hover:text-blue-700"
                        >
                            <span className="text-lg">+</span> THÊM SỰ KIỆN
                        </button>
                    </div>

                    {/* Event Entries */}
                    <div className="space-y-4">
                        {entries.map((entry) => (
                            <div key={entry.id} className="flex gap-4 pb-4 border-b border-gray-200 last:border-b-0">
                                {/* Date Column */}
                                <div className="flex-shrink-0 w-24 text-sm text-gray-600">
                                    {new Date(entry.eventDate).toLocaleDateString('en-GB')}
                                </div>

                                {/* Content Column */}
                                <div className="flex-1">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-base mb-1">{entry.title}</h3>
                                            <p className="text-sm text-gray-700 leading-relaxed">{entry.description}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditClick(entry)}
                                                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit2 size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(entry.id)}
                                                className="text-red-400 hover:text-red-600 flex-shrink-0"
                                                title="Xóa"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6">
                    <button
                        onClick={handleCancel}
                        disabled={!hasChanges()}
                        className={`px-6 py-2 border border-gray-300 rounded ${hasChanges()
                            ? 'hover:bg-gray-50 cursor-pointer'
                            : 'opacity-50 cursor-not-allowed'
                            }`}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasChanges()}
                        className={`px-6 py-2 rounded text-white ${hasChanges()
                            ? 'bg-black hover:bg-gray-800 cursor-pointer'
                            : 'bg-gray-400 cursor-not-allowed'
                            }`}
                    >
                        {
                            isLoading ? 
                            'Đang lưu...' :
                            'Lưu'
                        }
                    </button>
                </div>
            </div>

            {/* Add New Entry Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-semibold mb-4">Thêm sự kiện mới</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Tiêu đề</label>
                                <input
                                    type="text"
                                    value={newEntry.title}
                                    onChange={(e) => setNewEntry({ ...newEntry, title: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    placeholder="Nhập tiêu đề"
                                />
                            </div>
                            <CustomDatePicker
                                label='Ngày sự kiện'
                                value={newEntry.eventDate}
                                onChange={(data) => setNewEntry({ ...newEntry, eventDate: data })}
                                isEditing={showAddModal}
                            />
                            <div>
                                <label className="block text-sm font-medium mb-2">Nội dung</label>
                                <textarea
                                    value={newEntry.description}
                                    onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 h-32"
                                    placeholder="Nhập nội dung..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAddEntry}
                                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Thêm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Entry Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-semibold mb-4">Chỉnh sửa sự kiện</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">Tiêu đề</label>
                                <input
                                    type="text"
                                    value={editEntry.title}
                                    onChange={(e) => setEditEntry({ ...editEntry, title: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    placeholder="Nhập tiêu đề"
                                />
                            </div>
                            <CustomDatePicker
                                label='Ngày sự kiện'
                                value={editEntry.eventDate}
                                onChange={(data) => setEditEntry({ ...editEntry, eventDate: data })}
                                isEditing={showEditModal}
                            />
                            <div>
                                <label className="block text-sm font-medium mb-2">Nội dung</label>
                                <textarea
                                    value={editEntry.description}
                                    onChange={(e) => setEditEntry({ ...editEntry, description: e.target.value })}
                                    className="w-full border border-gray-300 rounded px-3 py-2 h-32"
                                    placeholder="Nhập nội dung..."
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowEditModal(false)}
                                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleUpdateEntry}
                                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Cập nhật
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-semibold mb-4">Xác nhận xóa</h3>
                        <p className="text-gray-600 mb-6">
                            Bạn có chắc chắn muốn xóa sự kiện này không?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default Biography;