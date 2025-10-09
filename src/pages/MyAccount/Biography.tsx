import React, { useState, useRef } from 'react';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Link2, Image, Trash2, Edit2 } from 'lucide-react';

interface BiographyEntry {
    id: string;
    title: string;
    startDate: string;
    endDate: string;
    content: string;
}

const Biography: React.FC = () => {
    const initialEntries: BiographyEntry[] = [
        {
            id: '1',
            title: 'Sinh sơn',
            startDate: '01/01/1990',
            endDate: '31/12/2000',
            content: 'Tôi sinh ra ở xã A, huyện B và lớn lên trong một gia đình có truyền thống văn hóa, tôi đã có...'
        },
        {
            id: '2',
            title: 'Sample',
            startDate: '01/01/1990',
            endDate: '31/12/2000',
            content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.'
        }
    ];

    const [entries, setEntries] = useState<BiographyEntry[]>(initialEntries);
    const [originalEntries, setOriginalEntries] = useState<BiographyEntry[]>(initialEntries);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const [newEntry, setNewEntry] = useState<BiographyEntry>({
        id: '',
        title: '',
        startDate: '',
        endDate: '',
        content: ''
    });

    const contentRef = useRef<HTMLDivElement>(null);

    const hasChanges = () => {
        return JSON.stringify(entries) !== JSON.stringify(originalEntries);
    };

    const hasActiveEditing = () => {
        return editingId !== null;
    };

    const handleEdit = (id: string) => {
        setEditingId(editingId === id ? null : id);
    };

    const handleEntryChange = (id: string, field: keyof BiographyEntry, value: string) => {
        setEntries(prev =>
            prev.map(entry => entry.id === id ? { ...entry, [field]: value } : entry)
        );
    };

    const handleAddClick = () => {
        setNewEntry({
            id: '',
            title: '',
            startDate: '',
            endDate: '',
            content: ''
        });
        setShowAddModal(true);
    };

    const handleAddEntry = () => {
        if (!newEntry.title || !newEntry.startDate || !newEntry.endDate) {
            alert('Vui lòng điền đầy đủ thông tin!');
            return;
        }

        const entry: BiographyEntry = {
            ...newEntry,
            id: Date.now().toString()
        };

        setEntries([...entries, entry]);
        setShowAddModal(false);
        setEditingId(entry.id);
    };

    const handleDeleteClick = (id: string) => {
        setDeleteId(id);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        if (deleteId) {
            setEntries(prev => prev.filter(entry => entry.id !== deleteId));
            if (editingId === deleteId) {
                setEditingId(null);
            }
        }
        setShowDeleteConfirm(false);
        setDeleteId(null);
    };

    const handleCancel = () => {
        if (hasActiveEditing()) {
            setEditingId(null);
            setEntries(originalEntries);
        }
    };

    const handleSave = () => {
        setOriginalEntries(entries);
        setEditingId(null);
        console.log('Saved:', entries);
    };

    const applyFormat = (command: string, value?: string) => {
        document.execCommand(command, false, value);
    };

    return (
        <>
            <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                <div className="p-8">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-semibold">Tiểu sử</h2>
                        <button
                            onClick={handleAddClick}
                            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                        >
                            + THÊM MỚI MỤC
                        </button>
                    </div>

                    {/* Biography Entries */}
                    <div className="space-y-6">
                        {entries.map((entry) => (
                            <div key={entry.id} className="border border-gray-300 rounded-lg">
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-300 flex justify-between items-center">
                                    <div className="flex-1">
                                        {editingId === entry.id ? (
                                            <input
                                                type="text"
                                                value={entry.title}
                                                onChange={(e) => handleEntryChange(entry.id, 'title', e.target.value)}
                                                className="font-semibold text-base border border-gray-300 rounded px-3 py-1 w-full"
                                                placeholder="Tiêu đề"
                                            />
                                        ) : (
                                            <h3 className="font-semibold text-base">{entry.title}</h3>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 ml-4">
                                        {editingId === entry.id ? (
                                            <div className="flex gap-2 text-sm text-gray-600">
                                                <input
                                                    type="text"
                                                    value={entry.startDate}
                                                    onChange={(e) => handleEntryChange(entry.id, 'startDate', e.target.value)}
                                                    placeholder="dd/mm/yyyy"
                                                    className="border border-gray-300 rounded px-2 py-1 w-24"
                                                />
                                                <span>-</span>
                                                <input
                                                    type="text"
                                                    value={entry.endDate}
                                                    onChange={(e) => handleEntryChange(entry.id, 'endDate', e.target.value)}
                                                    placeholder="dd/mm/yyyy"
                                                    className="border border-gray-300 rounded px-2 py-1 w-24"
                                                />
                                            </div>
                                        ) : (
                                            <span className="text-sm text-gray-600">
                                                {entry.startDate} - {entry.endDate}
                                            </span>
                                        )}
                                        <button
                                            onClick={() => handleEdit(entry.id)}
                                            className="text-gray-600 hover:text-gray-800"
                                            title="Chỉnh sửa"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteClick(entry.id)}
                                            className="text-red-600 hover:text-red-800"
                                            title="Xóa"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-4">
                                    {editingId === entry.id ? (
                                        <div>
                                            {/* Rich Text Toolbar */}
                                            <div className="flex gap-2 mb-2 pb-2 border-b border-gray-200">
                                                <button
                                                    onClick={() => applyFormat('bold')}
                                                    className="p-2 hover:bg-gray-100 rounded"
                                                    title="Bold"
                                                >
                                                    <Bold size={18} />
                                                </button>
                                                <button
                                                    onClick={() => applyFormat('italic')}
                                                    className="p-2 hover:bg-gray-100 rounded"
                                                    title="Italic"
                                                >
                                                    <Italic size={18} />
                                                </button>
                                                <button
                                                    onClick={() => applyFormat('underline')}
                                                    className="p-2 hover:bg-gray-100 rounded"
                                                    title="Underline"
                                                >
                                                    <Underline size={18} />
                                                </button>
                                                <div className="w-px bg-gray-300 mx-1"></div>
                                                <button
                                                    onClick={() => applyFormat('justifyLeft')}
                                                    className="p-2 hover:bg-gray-100 rounded"
                                                    title="Align Left"
                                                >
                                                    <AlignLeft size={18} />
                                                </button>
                                                <button
                                                    onClick={() => applyFormat('justifyCenter')}
                                                    className="p-2 hover:bg-gray-100 rounded"
                                                    title="Align Center"
                                                >
                                                    <AlignCenter size={18} />
                                                </button>
                                                <button
                                                    onClick={() => applyFormat('justifyRight')}
                                                    className="p-2 hover:bg-gray-100 rounded"
                                                    title="Align Right"
                                                >
                                                    <AlignRight size={18} />
                                                </button>
                                                <div className="w-px bg-gray-300 mx-1"></div>
                                                <button
                                                    onClick={() => {
                                                        const url = prompt('Nhập URL:');
                                                        if (url) applyFormat('createLink', url);
                                                    }}
                                                    className="p-2 hover:bg-gray-100 rounded"
                                                    title="Insert Link"
                                                >
                                                    <Link2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        const url = prompt('Nhập URL hình ảnh:');
                                                        if (url) applyFormat('insertImage', url);
                                                    }}
                                                    className="p-2 hover:bg-gray-100 rounded"
                                                    title="Insert Image"
                                                >
                                                    <Image size={18} />
                                                </button>
                                            </div>
                                            <div
                                                ref={contentRef}
                                                contentEditable
                                                onInput={(e) => {
                                                    handleEntryChange(entry.id, 'content', e.currentTarget.innerHTML);
                                                }}
                                                dangerouslySetInnerHTML={{ __html: entry.content }}
                                                className="min-h-32 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            className="text-sm text-gray-700"
                                            dangerouslySetInnerHTML={{ __html: entry.content }}
                                        />
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            onClick={handleCancel}
                            disabled={!hasActiveEditing()}
                            className={`px-6 py-2 border border-gray-300 rounded ${hasActiveEditing()
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
                            Lưu
                        </button>
                    </div>
                </div>
            </div>

            {/* Add New Entry Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-semibold mb-4">Thêm mục mới</h3>

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

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2">Ngày bắt đầu</label>
                                    <input
                                        type="text"
                                        value={newEntry.startDate}
                                        onChange={(e) => setNewEntry({ ...newEntry, startDate: e.target.value })}
                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                        placeholder="dd/mm/yyyy"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2">Ngày kết thúc</label>
                                    <input
                                        type="text"
                                        value={newEntry.endDate}
                                        onChange={(e) => setNewEntry({ ...newEntry, endDate: e.target.value })}
                                        className="w-full border border-gray-300 rounded px-3 py-2"
                                        placeholder="dd/mm/yyyy"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Nội dung</label>
                                <textarea
                                    value={newEntry.content}
                                    onChange={(e) => setNewEntry({ ...newEntry, content: e.target.value })}
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

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-semibold mb-4">Xác nhận xóa</h3>
                        <p className="text-gray-600 mb-6">
                            Bạn có chắc chắn muốn xóa mục tiểu sử này không?
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