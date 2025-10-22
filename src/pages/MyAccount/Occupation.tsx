import { Edit2, Plus, Trash2 } from 'lucide-react';
import CustomDatePicker from '@/components/ui/DatePicker';
import type { Education, WorkExperience, WorkPosition } from '@/types/biography';
import biographyService from '@/services/biographyService';
import { toast } from 'react-toastify';
import { useEffect, useState } from 'react';
import OccupationSkeleton from '@/components/skeleton/OccupationSkeleton';

const Occupation: React.FC = () => {

    const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>([]);
    const [educations, setEducations] = useState<Education[]>([]);
    const [originalWorkExperiences, setOriginalWorkExperiences] = useState<WorkExperience[]>([]);
    const [originalEducations, setOriginalEducations] = useState<Education[]>([]);
    const [editingWork, setEditingWork] = useState<string | null>(null);
    const [editingEducation, setEditingEducation] = useState<string | null>(null);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deleteEducationId, setDeleteEducationId] = useState<string | null>(null);
    const [showEditEducationModal, setShowEditEducationModal] = useState(false);
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [isAddingNewWork, setIsAddingNewWork] = useState(false);
    const [showEditWorkModal, setShowEditWorkModal] = useState(false);
    const [showDeleteWorkConfirm, setShowDeleteWorkConfirm] = useState(false);
    const [deleteWorkId, setDeleteWorkId] = useState<string | null>(null);
    const [initialLoading, setInitialLoading] = useState(false);
    const [isAddingNewLoading, setIsAddingNewLoading] = useState(false);
    const [isUpdateLoading, setIsUpdateLoading] = useState(false);
    const [showDeletePositionConfirm, setShowDeletePositionConfirm] = useState(false);
    const [deletePositionIndex, setDeletePositionIndex] = useState<number | null>(null);
    
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

    const [newWork, setNewWork] = useState<WorkExperience>({
        id: '',
        companyName: '',
        description: '',
        location: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        positions: []
    });

    const [editWork, setEditWork] = useState<WorkExperience>({
        id: '',
        companyName: '',
        description: '',
        location: '',
        startDate: '',
        endDate: '',
        isCurrent: false,
        positions: []
    });

    const [newPosition, setNewPosition] = useState<WorkPosition>({
        id: '',
        title: '',
        startDate: '',
        endDate: '',
        description: ''
    });

    const [editPosition, setEditPosition] = useState<WorkPosition | null>(null);
    const [editingPositionIndex, setEditingPositionIndex] = useState<number | null>(null);
    const [isAddingPosition, setIsAddingPosition] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setInitialLoading(true);
                const [educationRes, workRes] = await Promise.all([
                    biographyService.getEducation(),
                    biographyService.getWork()
                ]);
                setEducations(educationRes.data);
                setOriginalEducations(educationRes.data);
                setWorkExperiences(workRes.data);
                setOriginalWorkExperiences(workRes.data);
            } catch (error) {
                console.log(error);
                toast.error('Không thể tải dữ liệu');
            } finally {
                setInitialLoading(false);
            }
        };
        fetchData();
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
        const work = workExperiences.find(w => w.id === id);
        if (work) {
            setEditWork({ ...work, positions: [...work.positions] });
            setShowEditWorkModal(true);
            setNewPosition({
                id: '',
                title: '',
                startDate: '',
                endDate: '',
                description: ''
            });
            setEditPosition(null);
            setEditingPositionIndex(null);
            setIsAddingPosition(false);
        }
    };

    const handleEditEducation = (id: string) => {
        const edu = educations.find(e => e.id === id);
        if (edu) {
            setEditEducation({ ...edu });
            setShowEditEducationModal(true);
        }
    };

    const handleWorkChange = (field: keyof WorkExperience, value: string | boolean) => {
        if (isAddingNewWork) {
            setNewWork(prev => ({ ...prev, [field]: value }));
        } else if (showEditWorkModal) {
            setEditWork(prev => ({ ...prev, [field]: value }));
        }
    };

    const handleEducationChange = (field: keyof Education, value: string | boolean) => {
        if (isAddingNew) {
            setNewEducation(prev => ({ ...prev, [field]: value }));
        } else if (showEditEducationModal) {
            setEditEducation(prev => ({ ...prev, [field]: value }));
        }
    };

    // Position management functions
    const resetPositionForm = () => {
        setNewPosition({
            id: '',
            title: '',
            startDate: '',
            endDate: '',
            description: ''
        });
        setIsAddingPosition(false);
    };

    const handleStartAddPosition = () => {
        setIsAddingPosition(true);
        setEditPosition(null);
        setEditingPositionIndex(null);
    };

    const handleCancelAddPosition = () => {
        resetPositionForm();
    };

    const handleAddPosition = () => {
        // Validation
        if (!newPosition.title.trim()) {
            toast.error('Vui lòng nhập tên vị trí');
            return;
        }
        if (!newPosition.startDate) {
            toast.error('Vui lòng chọn ngày bắt đầu cho vị trí');
            return;
        }
        if (!newPosition.endDate) {
            toast.error('Vui lòng chọn ngày kết thúc cho vị trí');
            return;
        }

        const positionToAdd = {
            ...newPosition,
            id: Date.now().toString()
        };

        if (isAddingNewWork) {
            setNewWork(prev => ({
                ...prev,
                positions: [...prev.positions, positionToAdd]
            }));
        } else if (showEditWorkModal) {
            setEditWork(prev => ({
                ...prev,
                positions: [...prev.positions, positionToAdd]
            }));
        }

        resetPositionForm();
        toast.success('Đã thêm vị trí công việc');
    };

    const handleRemovePosition = (index: number) => {
        setDeletePositionIndex(index);
        setShowDeletePositionConfirm(true);
    };

    const confirmDeletePosition = () => {
        if (deletePositionIndex === null) return;

        if (isAddingNewWork) {
            setNewWork(prev => ({
                ...prev,
                positions: prev.positions.filter((_, i) => i !== deletePositionIndex)
            }));
        } else if (showEditWorkModal) {
            setEditWork(prev => ({
                ...prev,
                positions: prev.positions.filter((_, i) => i !== deletePositionIndex)
            }));
        }

        setShowDeletePositionConfirm(false);
        setDeletePositionIndex(null);
        toast.success('Đã xóa vị trí công việc');
    };

    const handleEditPositionClick = (position: WorkPosition, index: number) => {
        setEditPosition({ ...position });
        setEditingPositionIndex(index);
        setIsAddingPosition(false);
    };

    const handleUpdatePosition = () => {
        if (!editPosition) return;
        
        // Validation
        if (!editPosition.title.trim()) {
            toast.error('Vui lòng nhập tên vị trí');
            return;
        }
        if (!editPosition.startDate) {
            toast.error('Vui lòng chọn ngày bắt đầu cho vị trí');
            return;
        }
        if (!editPosition.endDate) {
            toast.error('Vui lòng chọn ngày kết thúc cho vị trí');
            return;
        }

        if (isAddingNewWork) {
            setNewWork(prev => ({
                ...prev,
                positions: prev.positions.map((pos, i) => 
                    i === editingPositionIndex ? editPosition : pos
                )
            }));
        } else if (showEditWorkModal) {
            setEditWork(prev => ({
                ...prev,
                positions: prev.positions.map((pos, i) => 
                    i === editingPositionIndex ? editPosition : pos
                )
            }));
        }

        setEditPosition(null);
        setEditingPositionIndex(null);
        toast.success('Đã cập nhật vị trí công việc');
    };

    const handleCancelEditPosition = () => {
        setEditPosition(null);
        setEditingPositionIndex(null);
    };

    const addWorkExperience = () => {
        setNewWork({
            id: '',
            companyName: '',
            description: '',
            location: '',
            startDate: '',
            endDate: '',
            isCurrent: false,
            positions: []
        });
        resetPositionForm();
        setIsAddingNewWork(true);
    };

    const handleSaveNewWork = async () => {
        // Validation
        if (!newWork.companyName.trim()) {
            toast.error('Vui lòng nhập tên công ty');
            return;
        }
        if (!newWork.location.trim()) {
            toast.error('Vui lòng nhập địa điểm');
            return;
        }
        if (!newWork.startDate) {
            toast.error('Vui lòng chọn ngày bắt đầu');
            return;
        }
        if (!newWork.isCurrent && !newWork.endDate) {
            toast.error('Vui lòng chọn ngày kết thúc hoặc chọn "Đang làm việc"');
            return;
        }

        try {
            setIsAddingNewLoading(true);
            const response = await biographyService.createWork(newWork);
            setWorkExperiences([response.data, ...workExperiences]);
            setOriginalWorkExperiences([response.data, ...workExperiences]);
            setIsAddingNewWork(false);
            resetPositionForm();
            toast.success('Thêm công việc thành công');
        } catch (error) {
            console.log(error);
            toast.error('Không thể thêm công việc');
        } finally {
            setIsAddingNewLoading(false);
        }
    };

    const handleCancelNewWork = () => {
        setIsAddingNewWork(false);
        setNewWork({
            id: '',
            companyName: '',
            description: '',
            location: '',
            startDate: '',
            endDate: '',
            isCurrent: false,
            positions: []
        });
        resetPositionForm();
    };

    const handleUpdateWork = async () => {
        // Validation
        if (!editWork.companyName.trim()) {
            toast.error('Vui lòng nhập tên công ty');
            return;
        }
        if (!editWork.location.trim()) {
            toast.error('Vui lòng nhập địa điểm');
            return;
        }
        if (!editWork.startDate) {
            toast.error('Vui lòng chọn ngày bắt đầu');
            return;
        }
        if (!editWork.isCurrent && !editWork.endDate) {
            toast.error('Vui lòng chọn ngày kết thúc hoặc chọn "Đang làm việc"');
            return;
        }

        try {
            setIsUpdateLoading(true);
            await biographyService.updateWork(editWork);
            
            const updatedExperiences = workExperiences.map(work => 
                work.id === editWork.id ? editWork : work
            );
            
            setWorkExperiences(updatedExperiences);
            setOriginalWorkExperiences(updatedExperiences);
            setShowEditWorkModal(false);
            resetPositionForm();
            setEditPosition(null);
            setEditingPositionIndex(null);
            toast.success('Cập nhật công việc thành công');
        } catch (error) {
            console.log(error);
            toast.error('Không thể cập nhật công việc');
        } finally {
            setIsUpdateLoading(false);
        }
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
        setIsAddingNew(true);
    };

    const handleSaveNewEducation = async () => {
        // Validation
        if (!newEducation.institutionName.trim()) {
            toast.error('Vui lòng nhập tên trường');
            return;
        }
        // if (!newEducation.major.trim()) {
        //     toast.error('Vui lòng nhập chuyên ngành');
        //     return;
        // }
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
        
        try {
            const response = await biographyService.addEducation(newEducation);
            setEducations([response.data, ...educations]);
            setOriginalEducations([response.data, ...educations]);
            setIsAddingNew(false);
            toast.success('Thêm học vấn thành công');
        } catch (error) {
            console.log(error);
            toast.error('Không thể thêm học vấn');
        }
    };

    const handleCancelNewEducation = () => {
        setIsAddingNew(false);
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
            const updatedEducations = educations.map(edu => 
                edu.id === editEducation.id ? editEducation : edu
            );
            setEducations(updatedEducations);
            setOriginalEducations(updatedEducations);
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
        setDeleteWorkId(id);
        setShowDeleteWorkConfirm(true);
    };

    const confirmDeleteWork = async () => {
        if (!deleteWorkId) return;

        try {
            await biographyService.deleteWork(deleteWorkId);
            const updatedExperiences = workExperiences.filter(work => work.id !== deleteWorkId);
            setWorkExperiences(updatedExperiences);
            setOriginalWorkExperiences(updatedExperiences);
            if (editingWork === deleteWorkId) {
                setEditingWork(null);
            }
            toast.success('Xóa công việc thành công');
        } catch (error) {
            console.log(error);
            toast.error('Không thể xóa công việc');
        } finally {
            setShowDeleteWorkConfirm(false);
            setDeleteWorkId(null);
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
            const updatedEducations = educations.filter(edu => edu.id !== deleteEducationId);
            setEducations(updatedEducations);
            setOriginalEducations(updatedEducations);
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
        return date.toLocaleDateString('en-GB');
    };

    // Render position form component
    const renderPositionForm = (isEditing: boolean = false) => {
        const position = isEditing ? editPosition : newPosition;
        const setPosition = isEditing ? setEditPosition : setNewPosition;

        return (
            <div className="bg-gray-50 border border-gray-300 rounded p-3 space-y-3">
                <div>
                    <label className="block text-xs font-medium mb-1">
                        Tên vị trí <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={position?.title || ''}
                        onChange={(e) => setPosition((prev: any) => ({...prev!, title: e.target.value}))}
                        className="w-full border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                        placeholder="Ví dụ: Senior Developer"
                    />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <CustomDatePicker 
                        label='Ngày bắt đầu'
                        value={position?.startDate || ''}
                        onChange={(e) => setPosition((prev: any) => ({...prev!, startDate: e}))}
                        isEditing={true}
                    />
                    <CustomDatePicker 
                        label='Ngày kết thúc'
                        value={position?.endDate || ''}
                        onChange={(e) => setPosition((prev: any) => ({...prev!, endDate: e}))}
                        isEditing={true}
                    />
                </div>
                <div>
                    <label className="block text-xs font-medium mb-1">Mô tả</label>
                    <textarea
                        value={position?.description || ''}
                        onChange={(e) => setPosition((prev: any) => ({...prev!, description: e.target.value}))}
                        className="w-full h-16 border border-gray-300 rounded px-2 py-1 text-sm bg-white"
                        placeholder="Mô tả vai trò và trách nhiệm..."
                    />
                </div>
                <div className="flex justify-end gap-2">
                    <button
                        onClick={isEditing ? handleCancelEditPosition : handleCancelAddPosition}
                        className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-white"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={isEditing ? handleUpdatePosition : handleAddPosition}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                        {isEditing ? 'Cập nhật' : 'Thêm'}
                    </button>
                </div>
            </div>
        );
    };

    // Render positions list
    const renderPositionsList = (positions: WorkPosition[]) => {
        if (positions.length === 0) return null;

        return (
            <div className="space-y-2 mb-3">
                {positions.map((position, index) => (
                    <div key={position.id || index} className="bg-white border border-gray-300 rounded p-3">
                        {editingPositionIndex === index ? (
                            renderPositionForm(true)
                        ) : (
                            <>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="flex-1">
                                        <p className="font-medium text-sm">{position.title}</p>
                                        <p className="text-xs text-gray-600">
                                            {formatDisplayDate(position.startDate)} - {formatDisplayDate(position.endDate)}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEditPositionClick(position, index)}
                                            className="text-gray-600 hover:text-gray-800"
                                            title="Chỉnh sửa vị trí"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleRemovePosition(index)}
                                            className="text-red-600 hover:text-red-800"
                                            title="Xóa vị trí"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                {position.description && (
                                    <p className="text-xs text-gray-700 mt-1">{position.description}</p>
                                )}
                            </>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    // Render work positions section
    const renderWorkPositionsSection = (work: WorkExperience) => {
        return (
            <div className="border-t pt-4 mt-4">
                <div className="flex justify-between items-center mb-3">
                    <h5 className="font-semibold text-sm">Vị trí công việc</h5>
                    {!isAddingPosition && editingPositionIndex === null && (
                        <button
                            onClick={handleStartAddPosition}
                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
                        >
                            <Plus size={14} />
                            Thêm vị trí
                        </button>
                    )}
                </div>
                
                {renderPositionsList(work.positions)}
                
                {isAddingPosition && renderPositionForm(false)}

                {work.positions.length === 0 && !isAddingPosition && (
                    <p className="text-xs text-gray-500 italic">Chưa có vị trí công việc nào</p>
                )}
            </div>
        );
    };
    
    if(initialLoading) {
        return <OccupationSkeleton />
    }

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
                        {/* Add New Work Form */}
                        {isAddingNewWork && (
                            <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
                                <h4 className="font-semibold text-base mb-3">Thêm công việc mới</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Tên công ty <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={newWork.companyName}
                                            onChange={(e) => handleWorkChange('companyName', e.target.value)}
                                            className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
                                            placeholder="Nhập tên công ty"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Địa điểm <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={newWork.location}
                                            onChange={(e) => handleWorkChange('location', e.target.value)}
                                            className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
                                            placeholder="Nhập địa điểm"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <CustomDatePicker
                                            isEditing={isAddingNewWork}
                                            label='Ngày bắt đầu'
                                            value={newWork.startDate}
                                            onChange={(date) => handleWorkChange('startDate', date ? date : '')}
                                        />
                                        <CustomDatePicker
                                            label='Ngày kết thúc'
                                            isEditing={isAddingNewWork && !newWork.isCurrent}
                                            value={newWork.endDate}
                                            onChange={(date) => handleWorkChange('endDate', date ? date : '')}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={newWork.isCurrent}
                                            onChange={(e) => handleWorkChange('isCurrent', e.target.checked)}
                                            className="w-4 h-4"
                                        />
                                        <label className="text-sm">Đang làm việc</label>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">Mô tả</label>
                                        <textarea
                                            value={newWork.description}
                                            onChange={(e) => handleWorkChange('description', e.target.value)}
                                            className="w-full h-24 border border-gray-300 rounded px-3 py-2 bg-white"
                                            placeholder="Nhập mô tả..."
                                        />
                                    </div>

                                    {renderWorkPositionsSection(newWork)}

                                    <div className="flex justify-end gap-3 mt-4">
                                        <button
                                            onClick={handleCancelNewWork}
                                            className="px-4 py-2 border border-gray-300 rounded hover:bg-white"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            onClick={handleSaveNewWork}
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                        >
                                            {
                                                isAddingNewLoading ? 
                                                'Đang lưu...' : 
                                                'Lưu'
                                            }
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Existing Work Entries */}
                        {workExperiences.map((work) => (
                            <div key={work.id} className="border border-gray-300 rounded-lg p-4">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1">
                                        <h3 className="font-semibold text-base mb-1">{work.companyName}</h3>
                                        <p className="text-sm text-gray-600">{work.location}</p>
                                        <p className="text-sm text-gray-600">
                                            {formatDisplayDate(work.startDate)} - {work.isCurrent ? 'Hiện tại' : formatDisplayDate(work.endDate)}
                                        </p>
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

                                {work.description && (
                                    <p className="text-sm text-gray-700 mb-3">{work.description}</p>
                                )}

                                {work.positions && work.positions.length > 0 && (
                                    <div className="mt-3 pl-4 border-l-2 border-gray-200">
                                        <h4 className="text-sm font-semibold mb-2">Vị trí công việc:</h4>
                                        <div className="space-y-2">
                                            {work.positions.map((position) => (
                                                <div key={position.id} className="text-sm">
                                                    <p className="font-medium">{position.title}</p>
                                                    <p className="text-gray-600 text-xs">
                                                        {formatDisplayDate(position.startDate)} - {formatDisplayDate(position.endDate)}
                                                    </p>
                                                    {position.description && (
                                                        <p className="text-gray-700 mt-1">{position.description}</p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
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
                        {/* Add New Education Form */}
                        {isAddingNew && (
                            <div className="border-2 border-blue-500 rounded-lg p-4 bg-blue-50">
                                <h4 className="font-semibold text-base mb-3">Thêm học vấn mới</h4>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Tên trường <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={newEducation.institutionName}
                                            onChange={(e) => handleEducationChange('institutionName', e.target.value)}
                                            className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
                                            placeholder="Nhập tên trường"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Chuyên ngành
                                        </label>
                                        <input
                                            type="text"
                                            value={newEducation.major}
                                            onChange={(e) => handleEducationChange('major', e.target.value)}
                                            className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
                                            placeholder="Nhập chuyên ngành"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium mb-1">
                                            Địa điểm <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={newEducation.location}
                                            onChange={(e) => handleEducationChange('location', e.target.value)}
                                            className="w-full border border-gray-300 rounded px-3 py-2 bg-white"
                                            placeholder="Nhập địa điểm"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <CustomDatePicker
                                            isEditing={isAddingNew}
                                            label='Ngày bắt đầu'
                                            value={newEducation.startDate}
                                            onChange={(date) => handleEducationChange('startDate', date ? date : '')}
                                        />
                                        <CustomDatePicker
                                            label='Ngày kết thúc'
                                            isEditing={isAddingNew}
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
                                        <label className="block text-sm font-medium mb-1">Mô tả</label>
                                        <textarea
                                            value={newEducation.description}
                                            onChange={(e) => handleEducationChange('description', e.target.value)}
                                            className="w-full h-24 border border-gray-300 rounded px-3 py-2 bg-white"
                                            placeholder="Nhập mô tả..."
                                        />
                                    </div>

                                    <div className="flex justify-end gap-3 mt-4">
                                        <button
                                            onClick={handleCancelNewEducation}
                                            className="px-4 py-2 border border-gray-300 rounded hover:bg-white"
                                        >
                                            Hủy
                                        </button>
                                        <button
                                            onClick={handleSaveNewEducation}
                                            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                                        >
                                            Lưu
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Existing Education Entries */}
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

            {/* Edit Work Modal */}
            {showEditWorkModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <h3 className="text-xl font-semibold mb-4">Chỉnh sửa công việc</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Tên công ty <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editWork.companyName}
                                    onChange={(e) => handleWorkChange('companyName', e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    placeholder="Nhập tên công ty"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Địa điểm <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editWork.location}
                                    onChange={(e) => handleWorkChange('location', e.target.value)}
                                    className="w-full border border-gray-300 rounded px-3 py-2"
                                    placeholder="Nhập địa điểm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <CustomDatePicker
                                    isEditing={showEditWorkModal}
                                    label='Ngày bắt đầu'
                                    value={editWork.startDate}
                                    onChange={(date) => handleWorkChange('startDate', date ? date : '')}
                                />
                                <CustomDatePicker
                                    label='Ngày kết thúc'
                                    isEditing={showEditWorkModal && !editWork.isCurrent}
                                    value={editWork.endDate}
                                    onChange={(date) => handleWorkChange('endDate', date ? date : '')}
                                />
                            </div>

                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    checked={editWork.isCurrent}
                                    onChange={(e) => handleWorkChange('isCurrent', e.target.checked)}
                                    className="w-4 h-4"
                                />
                                <label className="text-sm">Đang làm việc</label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">Mô tả</label>
                                <textarea
                                    value={editWork.description}
                                    onChange={(e) => handleWorkChange('description', e.target.value)}
                                    className="w-full h-24 border border-gray-300 rounded px-3 py-2"
                                    placeholder="Nhập mô tả..."
                                />
                            </div>

                            {renderWorkPositionsSection(editWork)}
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowEditWorkModal(false);
                                    resetPositionForm();
                                    setEditPosition(null);
                                    setEditingPositionIndex(null);
                                }}
                                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleUpdateWork}
                                className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                            >
                                {
                                    isUpdateLoading ? 
                                    'Đang cập nhật...': 
                                    'Cập nhật'
                                }
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Work Confirmation Modal */}
            {showDeleteWorkConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-semibold mb-4">Xác nhận xóa</h3>
                        <p className="text-gray-600 mb-6">
                            Bạn có chắc chắn muốn xóa công việc này không? Tất cả các vị trí công việc liên quan cũng sẽ bị xóa.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteWorkConfirm(false)}
                                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmDeleteWork}
                                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Position Confirmation Modal */}
            {showDeletePositionConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-xl font-semibold mb-4">Xác nhận xóa</h3>
                        <p className="text-gray-600 mb-6">
                            Bạn có chắc chắn muốn xóa vị trí công việc này không?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowDeletePositionConfirm(false);
                                    setDeletePositionIndex(null);
                                }}
                                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmDeletePosition}
                                className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                            >
                                Xóa
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
                                    Chuyên ngành
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
                                    isEditing={showEditEducationModal}
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

            {/* Delete Education Confirmation Modal */}
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