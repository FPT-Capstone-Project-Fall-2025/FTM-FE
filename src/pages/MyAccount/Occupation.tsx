import React, { useState, useEffect } from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import CustomDatePicker from '@/components/ui/DatePicker';
import type { Education } from '@/types/biography';
import biographyService from '@/services/biographyService';
import { toast } from 'react-toastify';

interface WorkExperience {
    id: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
}

const initialWorkExperiences: WorkExperience[] = [
    {
        id: '1',
        company: 'Công ty ABC',
        location: 'Vị trí xyz - 1 năm 11 tháng\nĐà Nẵng, Việt Nam',
        startDate: '2021-08-01T00:00:00.000Z',
        endDate: '',
        description: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.'
    },
    {
        id: '2',
        company: 'Sample',
        location: '',
        startDate: '',
        endDate: '',
        description: 'Lorem ipsum dolor sit amet.'
    }
];

const Occupation: React.FC = () => {

    const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>(initialWorkExperiences);
    const [educations, setEducations] = useState<Education[]>([]);
    const [originalWorkExperiences, setOriginalWorkExperiences] = useState<WorkExperience[]>(initialWorkExperiences);
    const [originalEducations, setOriginalEducations] = useState<Education[]>([]);
    const [editingWork, setEditingWork] = useState<string | null>(null);
    const [editingEducation, setEditingEducation] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteEducationId, setDeleteEducationId] = useState<string | null>(null);
    const [showEditEducationModal, setShowEditEducationModal] = useState(false);
    const [showAddEducationModal, setShowAddEducationModal] = useState(false);
    const [newEducation, setNewEducation] = useState<Education>({
        id: '',
        institutionName: '',
        major: '',
        startDate: '',
        endDate: '',
        location: '',
        description: '',
        isCurrent: false
    });
    const [editEducation, setEditEducation] = useState<Education>({
        id: '',
        institutionName: '',
        major: '',
        startDate: '',
        endDate: '',
        location: '',
        description: '',
        isCurrent: false
    });

    useEffect(() => {
        const fetchEducations = async () => {
            try {
                const response = await biographyService.getEducation();
                setEducations(response.data);
                setOriginalEducations(response.data);
            } catch (error) {
                console.log(error);
                toast.error('Không thể tải dữ liệu học vấn');
            }
        };
        fetchEducations();
    }, []);

    // Check if there are any changes
    const hasChanges = () => {
        return JSON.stringify(workExperiences) !== JSON.stringify(originalWorkExperiences) ||
               JSON.stringify(educations) !== JSON.stringify(originalEducations);
    };

    // Check if any editing is active
    const hasActiveEditing = () => {
        return editingWork !== null || editingEducation !== null;
    };

    const handleEditWork = (id: string) => {
        setEditingWork(editingWork === id ? null : id);
    };

    const handleEditEducation = (id: string) => {
        const edu = educations.find(e => e.id === id);
        if (edu) {
            setEditEducation({ ...edu });
            setShowEditEducationModal(true);
        }
    };

    const handleWorkChange = (id: string, field: keyof WorkExperience, value: string) => {
        setWorkExperiences(prev =>
            prev.map(work => work.id === id ? { ...work, [field]: value } : work)
        );
    };

    const handleEducationChange = (field: keyof Education, value: string | boolean) => {
        if (showAddEducationModal) {
            setNewEducation(prev => ({ ...prev, [field]: value }));
        } else if (showEditEducationModal) {
            setEditEducation(prev => ({ ...prev, [field]: value }));
        }
    };

    const addWorkExperience = () => {
        const newWork: WorkExperience = {
            id: Date.now().toString(),
            company: '',
            location: '',
            startDate: '',
            endDate: '',
            description: ''
        };
        setWorkExperiences([...workExperiences, newWork]);
        setEditingWork(newWork.id);
    };

    const addEducation = () => {
        setNewEducation({
            id: '',
            institutionName: '',
            major: '',
            startDate: '',
            endDate: '',
            location: '',
            description: '',
            isCurrent: false
        });
        setShowAddEducationModal(true);
    };

    const handleAddEducation = async () => {
        // Validation
        if (!newEducation.institutionName.trim()) {
            toast.error('Vui lòng nhập tên trường');
            return;
        }
        if (!newEducation.major.trim()) {
            toast.error('Vui lòng nhập chuyên ngành');
            return;
        }
        if (!newEducation.startDate) {
            toast.error('Vui lòng chọn ngày bắt đầu');
            return;
        }
        if (!newEducation.isCurrent && !newEducation.endDate) {
            toast.error('Vui lòng chọn ngày kết thúc hoặc chọn "Đang học"');
            return;
        }
        if (!newEducation.location.trim()) {
            toast.error('Vui lòng nhập địa điểm');
            return;
        }
        
        const educationToAdd = {
            ...newEducation,
            id: Date.now().toString()
        };
        
        try {
            const response = await biographyService.addEducation(educationToAdd);
            setEducations([...educations, response.data]);
            setShowAddEducationModal(false);
            toast.success('Thêm học vấn thành công');
        } catch (error) {
            console.log(error);
            toast.error('Không thể thêm học vấn');
        }
    };

    const handleUpdateEducation = async () => {
        // Validation
        if (!editEducation.institutionName.trim()) {
            toast.error('Vui lòng nhập tên trường');
            return;
        }
        if (!editEducation.major.trim()) {
            toast.error('Vui lòng nhập chuyên ngành');
            return;
        }
        if (!editEducation.startDate) {
            toast.error('Vui lòng chọn ngày bắt đầu');
            return;
        }
        if (!editEducation.isCurrent && !editEducation.endDate) {
            toast.error('Vui lòng chọn ngày kết thúc hoặc chọn "Đang học"');
            return;
        }
        if (!editEducation.location.trim()) {
            toast.error('Vui lòng nhập địa điểm');
            return;
        }

        try {
            await biographyService.updateEducation(editEducation);
            setEducations(prev =>
                prev.map(edu => edu.id === editEducation.id ? editEducation : edu)
            );
            setShowEditEducationModal(false);
            toast.success('Cập nhật học vấn thành công');
        } catch (error) {
            console.log(error);
            toast.error('Không thể cập nhật học vấn');
        }
    };

    const handleCancel = () => {
        if (hasActiveEditing() || hasChanges()) {
            setEditingWork(null);
            setEditingEducation(null);
            setWorkExperiences(originalWorkExperiences);
            setEducations(originalEducations);
        }
    };

    const handleSave = async () => {
        try {
            // Save work experience changes if needed
            // (Add work experience API calls here if needed)
            
            setOriginalWorkExperiences(workExperiences);
            setOriginalEducations(educations);
            setEditingWork(null);
            setEditingEducation(null);
            
            toast.success('Lưu thông tin thành công');
        } catch (error) {
            console.log(error);
            toast.error('Không thể lưu thông tin');
        }
    };

    const handleDeleteWork = (id: string) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa kinh nghiệm làm việc này?')) {
            setWorkExperiences(prev => prev.filter(work => work.id !== id));
            if (editingWork === id) {
                setEditingWork(null);
            }
        }
    };

    const handleDeleteEducation = (id: string) => {
        setDeleteEducationId(id);
        setShowDeleteConfirm(true);
    };

    const confirmDeleteEducation = async () => {
        if (!deleteEducationId) return;
        
        try {
            await biographyService.deleteEducation(deleteEducationId);
            setEducations(prev => prev.filter(edu => edu.id !== deleteEducationId));
            if (editingEducation === deleteEducationId) {
                setEditingEducation(null);
            }
            toast.success('Xóa học vấn thành công');
        } catch (error) {
            console.log(error);
            toast.error('Không thể xóa học vấn');
        } finally {
            setShowDeleteConfirm(false);
            setDeleteEducationId(null);
        }
    };

    const formatDisplayDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
    };

    return (
        <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="p-8">
                {/* Work Experience Section */}
                <div className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Công việc</h2>
                        <button
                            onClick={addWorkExperience}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                        >
                            <Plus size={20} />
                            THÊM CÔNG VIỆC
                        </button>
                    </div>

                    <div className="space-y-4">
                        {workExperiences.map((work) => (
                            <div key={work.id} className="border border-gray-300 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex items-start gap-3 flex-1">
                                        <div className="flex-1">
                                            {editingWork === work.id ? (
                                                <div className="space-y-3">
                                                    <input
                                                        type="text"
                                                        value={work.company}
                                                        onChange={(e) => handleWorkChange(work.id, 'company', e.target.value)}
                                                        className="w-full font-semibold text-base border border-gray-300 rounded px-3 py-2"
                                                        placeholder="Tên công ty"
                                                    />
                                                    <textarea
                                                        value={work.location}
                                                        onChange={(e) => handleWorkChange(work.id, 'location', e.target.value)}
                                                        className="w-full text-sm text-gray-600 border border-gray-300 rounded px-3 py-2"
                                                        placeholder="Vị trí - thời gian&#10;Địa điểm"
                                                        rows={2}
                                                    />
                                                </div>
                                            ) : (
                                                <>
                                                    <h3 className="font-semibold text-base mb-1">{work.company}</h3>
                                                    <p className="text-sm text-gray-600 whitespace-pre-line">{work.location}</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => handleEditWork(work.id)}
                                            className="text-gray-600 hover:text-gray-800"
                                            title="Chỉnh sửa"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteWork(work.id)}
                                            className="text-red-600 hover:text-red-800"
                                            title="Xóa"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    {editingWork === work.id ? (
                                        <>
                                            <CustomDatePicker
                                                isEditing={editingWork === work.id}
                                                label='Ngày bắt đầu'
                                                value={work.startDate}
                                                onChange={(date) => handleWorkChange(work.id, 'startDate', date ? date : '')}
                                            />
                                            
                                            <CustomDatePicker
                                                label='Ngày kết thúc'
                                                isEditing={editingWork === work.id}
                                                value={work.endDate}
                                                onChange={(date) => handleWorkChange(work.id, 'endDate', date ? date : '')}
                                            />
                                        </>
                                    ) : (
                                        <div className="col-span-2 flex items-center gap-3 text-sm text-gray-600">
                                            <span>{formatDisplayDate(work.startDate) || 'dd/mm/yyyy'}</span>
                                            <span>-</span>
                                            <span>{work.endDate ? formatDisplayDate(work.endDate) : 'Hiện tại'}</span>
                                        </div>
                                    )}
                                </div>

                                {editingWork === work.id ? (
                                    <textarea
                                        value={work.description}
                                        onChange={(e) => handleWorkChange(work.id, 'description', e.target.value)}
                                        className="w-full text-sm text-gray-700 border border-gray-300 rounded px-3 py-2"
                                        placeholder="Mô tả công việc"
                                        rows={3}
                                    />
                                ) : (
                                    <p className="text-sm text-gray-700">{work.description}</p>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Education Section */}
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-semibold">Học vấn</h2>
                        <button
                            onClick={addEducation}
                            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium"
                        >
                            <Plus size={20} />
                            THÊM HỌC VẤN
                        </button>
                    </div>

                    <div className="space-y-4">
                        {educations.map((edu) => (
                            <div key={edu.id} className="border border-gray-300 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-base mb-1">{edu.institutionName}</h3>
                                        <p className="text-sm text-gray-600">{edu.major}</p>
                                        <p className="text-sm text-gray-600">{edu.location}</p>
                                        <p className="text-sm text-gray-600">
                                            {formatDisplayDate(edu.startDate)} - {edu.isCurrent ? 'Hiện tại' : formatDisplayDate(edu.endDate)}
                                        </p>
                                    </div>
                                    <div className="flex gap-2 ml-4">
                                        <button
                                            onClick={() => handleEditEducation(edu.id)}
                                            className="text-gray-600 hover:text-gray-800"
                                            title="Chỉnh sửa"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteEducation(edu.id)}
                                            className="text-red-600 hover:text-red-800"
                                            title="Xóa"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>

                                {edu.description && (
                                    <div className="mt-3">
                                        <label className="font-semibold text-sm mb-2 block">Mô tả</label>
                                        <div className="border border-gray-300 rounded px-3 py-2 text-sm text-gray-700">
                                            {edu.description}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mt-6">
                    <button 
                        onClick={handleCancel}
                        disabled={!hasActiveEditing() && !hasChanges()}
                        className={`px-6 py-2 border border-gray-300 rounded ${
                            hasActiveEditing() || hasChanges()
                                ? 'hover:bg-gray-50 cursor-pointer' 
                                : 'opacity-50 cursor-not-allowed'
                        }`}
                    >
                        Hủy
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={!hasChanges()}
                        className={`px-6 py-2 rounded text-white ${
                            hasChanges()
                                ? 'bg-black hover:bg-gray-800 cursor-pointer'
                                : 'bg-gray-400 cursor-not-allowed'
                        }`}
                    >
                        Lưu
                    </button>
                </div>
            </div>

            {/* Add Education Modal */}
            {showAddEducationModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-semibold mb-4">Thêm học vấn mới</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Tên trường <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newEducation.institutionName}
                                    onChange={(e) => handleEducationChange('institutionName', e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    placeholder="Nhập tên trường"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Chuyên ngành <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newEducation.major}
                                    onChange={(e) => handleEducationChange('major', e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    placeholder="Nhập chuyên ngành"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Địa điểm <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={newEducation.location}
                                    onChange={(e) => handleEducationChange('location', e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    placeholder="Nhập địa điểm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <CustomDatePicker
                                    isEditing={showAddEducationModal}
                                    label='Ngày bắt đầu'
                                    value={newEducation.startDate}
                                    onChange={(date) => handleEducationChange('startDate', date ? date : '')}
                                />
                                <CustomDatePicker
                                    label='Ngày kết thúc'
                                    isEditing={showAddEducationModal && !newEducation.isCurrent}
                                    value={newEducation.endDate}
                                    onChange={(date) => handleEducationChange('endDate', date ? date : '')}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={newEducation.isCurrent}
                                    onChange={(e) => handleEducationChange('isCurrent', e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label className="text-sm">Đang học</label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Mô tả</label>
                                <textarea
                                    value={newEducation.description}
                                    onChange={(e) => handleEducationChange('description', e.target.value)}
                                    className="w-full h-24 border border-gray-300 rounded px-3 py-2"
                                    placeholder="Nhập mô tả..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowAddEducationModal(false)}
                                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleAddEducation}
                                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                Thêm
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Education Modal */}
            {showEditEducationModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-semibold mb-4">Chỉnh sửa học vấn</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Tên trường <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editEducation.institutionName}
                                    onChange={(e) => handleEducationChange('institutionName', e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    placeholder="Nhập tên trường"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Chuyên ngành <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editEducation.major}
                                    onChange={(e) => handleEducationChange('major', e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    placeholder="Nhập chuyên ngành"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Địa điểm <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editEducation.location}
                                    onChange={(e) => handleEducationChange('location', e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    placeholder="Nhập địa điểm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <CustomDatePicker
                                    isEditing={showEditEducationModal}
                                    label='Ngày bắt đầu'
                                    value={editEducation.startDate}
                                    onChange={(date) => handleEducationChange('startDate', date ? date : '')}
                                />
                                <CustomDatePicker
                                    label='Ngày kết thúc'
                                    isEditing={showEditEducationModal && !editEducation.isCurrent}
                                    value={editEducation.endDate}
                                    onChange={(date) => handleEducationChange('endDate', date ? date : '')}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={editEducation.isCurrent}
                                    onChange={(e) => handleEducationChange('isCurrent', e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label className="text-sm">Đang học</label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Mô tả</label>
                                <textarea
                                    value={editEducation.description}
                                    onChange={(e) => handleEducationChange('description', e.target.value)}
                                    className="w-full h-24 border border-gray-300 rounded px-3 py-2"
                                    placeholder="Nhập mô tả..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => setShowEditEducationModal(false)}
                                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleUpdateEducation}
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
                            Bạn có chắc chắn muốn xóa học vấn này không?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmDeleteEducation}
                                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
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

export default Occupation;