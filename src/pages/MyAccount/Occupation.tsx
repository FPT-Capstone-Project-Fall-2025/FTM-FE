import OccupationSkeleton from '@/components/skeleton/OccupationSkeleton';
import CustomDatePicker from '@/components/ui/DatePicker';
import biographyService from '@/services/biographyService';
import type { Education, WorkExperience, WorkPosition } from '@/types/biography';
import { Edit2, Plus, Trash2, Briefcase, GraduationCap, MapPin, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';

const Occupation = () => {

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
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-4 space-y-4 shadow-sm animate-fadeIn">
                <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-800">
                        Tên vị trí <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={position?.title || ''}
                        onChange={(e) => setPosition((prev: any) => ({ ...prev, title: e.target.value }))}
                        className="w-full border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                        placeholder="Ví dụ: Senior Developer"
                    />
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <CustomDatePicker
                        label='Ngày bắt đầu'
                        value={position?.startDate || ''}
                        onChange={(e) => setPosition((prev: any) => ({ ...prev, startDate: e }))}
                        isEditing={true}
                    />
                    <CustomDatePicker
                        label='Ngày kết thúc'
                        value={position?.endDate || ''}
                        onChange={(e) => setPosition((prev: any) => ({ ...prev, endDate: e }))}
                        isEditing={true}
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold mb-2 text-gray-800">Mô tả</label>
                    <textarea
                        value={position?.description || ''}
                        onChange={(e) => setPosition((prev: any) => ({ ...prev, description: e.target.value }))}
                        className="w-full h-20 border-2 border-gray-300 rounded-lg px-4 py-2.5 text-sm bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                        placeholder="Mô tả vai trò và trách nhiệm..."
                    />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        onClick={isEditing ? handleCancelEditPosition : handleCancelAddPosition}
                        className="px-5 py-2 text-sm font-medium border-2 border-gray-300 rounded-lg hover:bg-white hover:shadow-md transition-all duration-200 cursor-pointer"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={isEditing ? handleUpdatePosition : handleAddPosition}
                        className="px-5 py-2 text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer"
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
            <div className="space-y-3 mb-4">
                {positions.map((position, index) => (
                    <div key={position.id || index} className="relative">
                        {/* Timeline connector */}
                        {index < positions.length - 1 && (
                            <div className="absolute left-4 top-12 w-0.5 h-full bg-gradient-to-b from-blue-400 to-transparent"></div>
                        )}

                        <div className="bg-white border-2 border-blue-100 rounded-xl p-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                            {editingPositionIndex === index ? (
                                renderPositionForm(true)
                            ) : (
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600"></div>
                                                <p className="font-semibold text-base text-gray-800">{position.title}</p>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <Calendar size={14} className="text-blue-500" />
                                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700">
                                                    {formatDisplayDate(position.startDate)} - {formatDisplayDate(position.endDate)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleEditPositionClick(position, index)}
                                                className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-lg transition-all duration-200 cursor-pointer"
                                                title="Chỉnh sửa vị trí"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleRemovePosition(index)}
                                                className="p-2 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-lg transition-all duration-200 cursor-pointer"
                                                title="Xóa vị trí"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    {position.description && (
                                        <p className="text-sm text-gray-700 leading-relaxed pl-4 border-l-2 border-blue-200">{position.description}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // Render work positions section
    const renderWorkPositionsSection = (work: WorkExperience) => {
        return (
            <div className="border-t-2 border-dashed border-gray-200 pt-5 mt-5">
                <div className="flex justify-between items-center mb-4">
                    <h5 className="font-bold text-base text-gray-800 flex items-center gap-2">
                        <div className="w-1 h-5 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                        Vị trí công việc
                    </h5>
                    {!isAddingPosition && editingPositionIndex === null && (
                        <button
                            onClick={handleStartAddPosition}
                            className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-semibold bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-all duration-200 hover:shadow-md cursor-pointer"
                        >
                            <Plus size={16} />
                            Thêm vị trí
                        </button>
                    )}
                </div>

                {renderPositionsList(work.positions)}

                {isAddingPosition && renderPositionForm(false)}

                {work.positions.length === 0 && !isAddingPosition && (
                    <p className="text-sm text-gray-500 italic text-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                        Chưa có vị trí công việc nào
                    </p>
                )}
            </div>
        );
    };

    if (initialLoading) {
        return <OccupationSkeleton />
    }

    return (
        <div className="h-full bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 py-8">
            <div className="mx-auto">
                <div className="bg-white/80 backdrop-blur-xl shadow-2xl rounded-3xl border border-gray-200 overflow-hidden">
                    <div className="p-10">
                        {/* Work Experience Section */}
                        <div className="mb-12">
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                                        <Briefcase size={24} className="text-white" />
                                    </div>
                                    <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                        Công việc
                                    </h2>
                                </div>
                                <button
                                    onClick={addWorkExperience}
                                    className="flex items-center gap-2 text-white font-semibold px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                                >
                                    <Plus size={20} />
                                    THÊM CÔNG VIỆC
                                </button>
                            </div>

                            {/* Gradient separator */}
                            <div className="h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-full mb-8"></div>

                            <div className="space-y-6">
                                {/* Add New Work Form */}
                                {isAddingNewWork && (
                                    <div className="relative overflow-hidden border-2 border-blue-300 rounded-2xl p-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50 shadow-xl animate-fadeIn">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-200 to-indigo-200 rounded-full blur-3xl opacity-20 -mr-32 -mt-32"></div>

                                        <h4 className="font-bold text-xl mb-6 text-gray-800 relative z-10 flex items-center gap-2">
                                            <div className="w-1.5 h-6 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                                            Thêm công việc mới
                                        </h4>
                                        <div className="space-y-5 relative z-10">
                                            <div>
                                                <label className="block text-sm font-semibold mb-2 text-gray-800">
                                                    Tên công ty <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newWork.companyName}
                                                    onChange={(e) => handleWorkChange('companyName', e.target.value)}
                                                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                                                    placeholder="Nhập tên công ty"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold mb-2 text-gray-800 flex items-center gap-2">
                                                    <MapPin size={16} className="text-blue-500" />
                                                    Địa điểm <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newWork.location}
                                                    onChange={(e) => handleWorkChange('location', e.target.value)}
                                                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                                                    placeholder="Nhập địa điểm"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-5">
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

                                            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-gray-200">
                                                <input
                                                    type="checkbox"
                                                    checked={newWork.isCurrent}
                                                    onChange={(e) => handleWorkChange('isCurrent', e.target.checked)}
                                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                                />
                                                <label className="text-sm font-medium text-gray-700 cursor-pointer">Đang làm việc</label>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold mb-2 text-gray-800">Mô tả</label>
                                                <textarea
                                                    value={newWork.description}
                                                    onChange={(e) => handleWorkChange('description', e.target.value)}
                                                    className="w-full h-28 border-2 border-gray-300 rounded-xl px-4 py-3 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 resize-none"
                                                    placeholder="Nhập mô tả..."
                                                />
                                            </div>

                                            {renderWorkPositionsSection(newWork)}

                                            <div className="flex justify-end gap-4 pt-4">
                                                <button
                                                    onClick={handleCancelNewWork}
                                                    className="px-6 py-3 font-medium border-2 border-gray-300 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-200 cursor-pointer"
                                                >
                                                    Hủy
                                                </button>
                                                <button
                                                    onClick={handleSaveNewWork}
                                                    disabled={isAddingNewLoading}
                                                    className="px-6 py-3 font-medium bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isAddingNewLoading ? (
                                                        <span className="flex items-center gap-2">
                                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                            Đang lưu...
                                                        </span>
                                                    ) : 'Lưu'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Existing Work Entries */}
                                {workExperiences.map((work) => (
                                    <div key={work.id} className="group relative overflow-hidden border-2 border-gray-200 rounded-2xl p-6 bg-white hover:border-blue-300 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                                        {/* Gradient overlay on hover */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                                                            <Briefcase size={20} className="text-white" />
                                                        </div>
                                                        <h3 className="font-bold text-xl text-gray-800">{work.companyName}</h3>
                                                    </div>
                                                    <div className="flex flex-col gap-2 ml-13">
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <MapPin size={14} className="text-blue-500" />
                                                            <span>{work.location}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar size={14} className="text-blue-500" />
                                                            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700">
                                                                {formatDisplayDate(work.startDate)} - {work.isCurrent ? 'Hiện tại' : formatDisplayDate(work.endDate)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 ml-4">
                                                    <button
                                                        onClick={() => handleEditWork(work.id)}
                                                        className="p-3 text-blue-600 hover:text-blue-800 hover:bg-blue-100 rounded-xl transition-all duration-200 cursor-pointer"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteWork(work.id)}
                                                        className="p-3 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-xl transition-all duration-200 cursor-pointer"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            {work.description && (
                                                <p className="text-sm text-gray-700 leading-relaxed mb-4 pl-13 border-l-4 border-blue-200 ml-13">{work.description}</p>
                                            )}

                                            {work.positions && work.positions.length > 0 && (
                                                <div className="mt-5 pl-13 ml-13 border-l-2 border-dashed border-blue-200">
                                                    <h4 className="text-sm font-bold mb-3 text-gray-800 flex items-center gap-2">
                                                        <div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-indigo-600 rounded-full"></div>
                                                        Vị trí công việc:
                                                    </h4>
                                                    <div className="space-y-3">
                                                        {work.positions.map((position) => (
                                                            <div key={position.id} className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-100">
                                                                <p className="font-semibold text-sm text-gray-800 mb-1">{position.title}</p>
                                                                <p className="text-gray-600 text-xs mb-2 flex items-center gap-2">
                                                                    <Calendar size={12} className="text-blue-500" />
                                                                    {formatDisplayDate(position.startDate)} - {formatDisplayDate(position.endDate)}
                                                                </p>
                                                                {position.description && (
                                                                    <p className="text-gray-700 text-sm mt-2 pl-3 border-l-2 border-blue-300">{position.description}</p>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Education Section */}
                        <div>
                            <div className="flex justify-between items-center mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-lg">
                                        <GraduationCap size={24} className="text-white" />
                                    </div>
                                    <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                                        Học vấn
                                    </h2>
                                </div>
                                <button
                                    onClick={addEducation}
                                    className="flex items-center gap-2 text-white font-semibold px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                                >
                                    <Plus size={20} />
                                    THÊM HỌC VẤN
                                </button>
                            </div>

                            {/* Gradient separator */}
                            <div className="h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full mb-8"></div>

                            <div className="space-y-6">
                                {/* Add New Education Form */}
                                {isAddingNew && (
                                    <div className="relative overflow-hidden border-2 border-purple-300 rounded-2xl p-6 bg-gradient-to-br from-purple-50 via-white to-pink-50 shadow-xl animate-fadeIn">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200 to-pink-200 rounded-full blur-3xl opacity-20 -mr-32 -mt-32"></div>

                                        <h4 className="font-bold text-xl mb-6 text-gray-800 relative z-10 flex items-center gap-2">
                                            <div className="w-1.5 h-6 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
                                            Thêm học vấn mới
                                        </h4>
                                        <div className="space-y-5 relative z-10">
                                            <div>
                                                <label className="block text-sm font-semibold mb-2 text-gray-800">
                                                    Tên trường <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newEducation.institutionName}
                                                    onChange={(e) => handleEducationChange('institutionName', e.target.value)}
                                                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200"
                                                    placeholder="Nhập tên trường"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold mb-2 text-gray-800">
                                                    Chuyên ngành
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newEducation.major}
                                                    onChange={(e) => handleEducationChange('major', e.target.value)}
                                                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200"
                                                    placeholder="Nhập chuyên ngành"
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold mb-2 text-gray-800 flex items-center gap-2">
                                                    <MapPin size={16} className="text-purple-500" />
                                                    Địa điểm <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    type="text"
                                                    value={newEducation.location}
                                                    onChange={(e) => handleEducationChange('location', e.target.value)}
                                                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200"
                                                    placeholder="Nhập địa điểm"
                                                />
                                            </div>

                                            <div className="grid grid-cols-2 gap-5">
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

                                            <div className="flex items-center gap-3 p-4 bg-white rounded-xl border-2 border-gray-200">
                                                <input
                                                    type="checkbox"
                                                    checked={newEducation.isCurrent}
                                                    onChange={(e) => handleEducationChange('isCurrent', e.target.checked)}
                                                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer"
                                                />
                                                <label className="text-sm font-medium text-gray-700 cursor-pointer">Đang học</label>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-semibold mb-2 text-gray-800">Mô tả</label>
                                                <textarea
                                                    value={newEducation.description}
                                                    onChange={(e) => handleEducationChange('description', e.target.value)}
                                                    className="w-full h-28 border-2 border-gray-300 rounded-xl px-4 py-3 bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 resize-none"
                                                    placeholder="Nhập mô tả..."
                                                />
                                            </div>

                                            <div className="flex justify-end gap-4 pt-4">
                                                <button
                                                    onClick={handleCancelNewEducation}
                                                    className="px-6 py-3 font-medium border-2 border-gray-300 rounded-xl hover:bg-white hover:shadow-lg transition-all duration-200 cursor-pointer"
                                                >
                                                    Hủy
                                                </button>
                                                <button
                                                    onClick={handleSaveNewEducation}
                                                    className="px-6 py-3 font-medium bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                                                >
                                                    Lưu
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Existing Education Entries */}
                                {educations.map((edu) => (
                                    <div key={edu.id} className="group relative overflow-hidden border-2 border-gray-200 rounded-2xl p-6 bg-white hover:border-purple-300 hover:shadow-2xl hover:-translate-y-2 transition-all duration-300">
                                        {/* Gradient overlay on hover */}
                                        <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                                        <div className="relative z-10">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center shadow-md">
                                                            <GraduationCap size={20} className="text-white" />
                                                        </div>
                                                        <h3 className="font-bold text-xl text-gray-800">{edu.institutionName}</h3>
                                                    </div>
                                                    <div className="flex flex-col gap-2 ml-13">
                                                        <p className="text-sm font-medium text-gray-700">{edu.major}</p>
                                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                                            <MapPin size={14} className="text-purple-500" />
                                                            <span>{edu.location}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar size={14} className="text-purple-500" />
                                                            <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs font-semibold bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700">
                                                                {formatDisplayDate(edu.startDate)} - {edu.isCurrent ? 'Hiện tại' : formatDisplayDate(edu.endDate)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 ml-4">
                                                    <button
                                                        onClick={() => handleEditEducation(edu.id)}
                                                        className="p-3 text-purple-600 hover:text-purple-800 hover:bg-purple-100 rounded-xl transition-all duration-200 cursor-pointer"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteEducation(edu.id)}
                                                        className="p-3 text-red-600 hover:text-red-800 hover:bg-red-100 rounded-xl transition-all duration-200 cursor-pointer"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>

                                            {edu.description && (
                                                <div className="mt-4 pl-13 ml-13">
                                                    <label className="font-semibold text-sm mb-2 block text-gray-800 flex items-center gap-2">
                                                        <div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-pink-600 rounded-full"></div>
                                                        Mô tả
                                                    </label>
                                                    <div className="border-2 border-purple-100 rounded-xl px-4 py-3 text-sm text-gray-700 bg-gradient-to-r from-purple-50 to-pink-50">
                                                        {edu.description}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-4 mt-10 pt-6 border-t-2 border-gray-200">
                            <button
                                onClick={handleCancel}
                                disabled={!hasActiveEditing() && !hasChanges()}
                                className={`px-8 py-3 font-semibold border-2 border-gray-300 rounded-xl transition-all duration-200 ${hasActiveEditing() || hasChanges()
                                    ? 'hover:bg-white hover:shadow-lg cursor-pointer'
                                    : 'opacity-50 cursor-not-allowed'
                                    }`}
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!hasChanges()}
                                className={`px-8 py-3 font-semibold rounded-xl text-white transition-all duration-200 ${hasChanges()
                                    ? 'bg-gradient-to-r from-gray-800 to-black hover:from-gray-900 hover:to-gray-800 hover:shadow-xl hover:-translate-y-1 cursor-pointer'
                                    : 'bg-gray-400 cursor-not-allowed'
                                    }`}
                            >
                                Lưu
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Work Modal */}
            {showEditWorkModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-gray-200 animate-scaleIn">
                        <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                                <Edit2 size={20} className="text-white" />
                            </div>
                            Chỉnh sửa công việc
                        </h3>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-800">
                                    Tên công ty <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editWork.companyName}
                                    onChange={(e) => handleWorkChange('companyName', e.target.value)}
                                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                                    placeholder="Nhập tên công ty"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-800 flex items-center gap-2">
                                    <MapPin size={16} className="text-blue-500" />
                                    Địa điểm <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editWork.location}
                                    onChange={(e) => handleWorkChange('location', e.target.value)}
                                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200"
                                    placeholder="Nhập địa điểm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
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

                            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-xl border-2 border-blue-200">
                                <input
                                    type="checkbox"
                                    checked={editWork.isCurrent}
                                    onChange={(e) => handleWorkChange('isCurrent', e.target.checked)}
                                    className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                />
                                <label className="text-sm font-medium text-gray-700 cursor-pointer">Đang làm việc</label>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-800">Mô tả</label>
                                <textarea
                                    value={editWork.description}
                                    onChange={(e) => handleWorkChange('description', e.target.value)}
                                    className="w-full h-28 border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-200 resize-none"
                                    placeholder="Nhập mô tả..."
                                />
                            </div>

                            {renderWorkPositionsSection(editWork)}
                        </div>

                        <div className="flex justify-end gap-4 mt-8 pt-6 border-t-2 border-gray-200">
                            <button
                                onClick={() => {
                                    setShowEditWorkModal(false);
                                    resetPositionForm();
                                    setEditPosition(null);
                                    setEditingPositionIndex(null);
                                }}
                                className="px-8 py-3 font-semibold border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:shadow-lg transition-all duration-200 cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleUpdateWork}
                                disabled={isUpdateLoading}
                                className="px-8 py-3 font-semibold bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUpdateLoading ? (
                                    <span className="flex items-center gap-2">
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        Đang cập nhật...
                                    </span>
                                ) : 'Cập nhật'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Work Confirmation Modal */}
            {showDeleteWorkConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border-2 border-gray-200 animate-scaleIn">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-pink-600">
                            <Trash2 size={28} className="text-white" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-center text-gray-800">Xác nhận xóa</h3>
                        <p className="text-gray-600 mb-6 text-center leading-relaxed">
                            Bạn có chắc chắn muốn xóa công việc này không? Tất cả các vị trí công việc liên quan cũng sẽ bị xóa.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteWorkConfirm(false)}
                                className="px-6 py-3 font-semibold border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:shadow-lg transition-all duration-200 cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmDeleteWork}
                                className="px-6 py-3 font-semibold bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Position Confirmation Modal */}
            {showDeletePositionConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border-2 border-gray-200 animate-scaleIn">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-pink-600">
                            <Trash2 size={28} className="text-white" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-center text-gray-800">Xác nhận xóa</h3>
                        <p className="text-gray-600 mb-6 text-center leading-relaxed">
                            Bạn có chắc chắn muốn xóa vị trí công việc này không?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => {
                                    setShowDeletePositionConfirm(false);
                                    setDeletePositionIndex(null);
                                }}
                                className="px-6 py-3 font-semibold border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:shadow-lg transition-all duration-200 cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmDeletePosition}
                                className="px-6 py-3 font-semibold bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Education Modal */}
            {showEditEducationModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-gray-200 animate-scaleIn">
                        <h3 className="text-2xl font-bold mb-6 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center">
                                <Edit2 size={20} className="text-white" />
                            </div>
                            Chỉnh sửa học vấn
                        </h3>

                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-800">
                                    Tên trường <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editEducation.institutionName}
                                    onChange={(e) => handleEducationChange('institutionName', e.target.value)}
                                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200"
                                    placeholder="Nhập tên trường"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-800">
                                    Chuyên ngành
                                </label>
                                <input
                                    type="text"
                                    value={editEducation.major}
                                    onChange={(e) => handleEducationChange('major', e.target.value)}
                                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200"
                                    placeholder="Nhập chuyên ngành"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-800 flex items-center gap-2">
                                    <MapPin size={16} className="text-purple-500" />
                                    Địa điểm <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={editEducation.location}
                                    onChange={(e) => handleEducationChange('location', e.target.value)}
                                    className="w-full border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200"
                                    placeholder="Nhập địa điểm"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
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

                            <div className="flex items-center gap-3 p-4 bg-purple-50 rounded-xl border-2 border-purple-200">
                                <input
                                    type="checkbox"
                                    checked={editEducation.isCurrent}
                                    onChange={(e) => handleEducationChange('isCurrent', e.target.checked)}
                                    className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer"
                                />
                                <label className="text-sm font-medium text-gray-700 cursor-pointer">Đang học</label>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2 text-gray-800">Mô tả</label>
                                <textarea
                                    value={editEducation.description}
                                    onChange={(e) => handleEducationChange('description', e.target.value)}
                                    className="w-full h-28 border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-200 resize-none"
                                    placeholder="Nhập mô tả..."
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-4 mt-8 pt-6 border-t-2 border-gray-200">
                            <button
                                onClick={() => setShowEditEducationModal(false)}
                                className="px-8 py-3 font-semibold border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:shadow-lg transition-all duration-200 cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={handleUpdateEducation}
                                className="px-8 py-3 font-semibold bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-xl hover:from-purple-600 hover:to-pink-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                            >
                                Cập nhật
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Education Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
                    <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl border-2 border-gray-200 animate-scaleIn">
                        <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-red-500 to-pink-600">
                            <Trash2 size={28} className="text-white" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-center text-gray-800">Xác nhận xóa</h3>
                        <p className="text-gray-600 mb-6 text-center leading-relaxed">
                            Bạn có chắc chắn muốn xóa học vấn này không?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => setShowDeleteConfirm(false)}
                                className="px-6 py-3 font-semibold border-2 border-gray-300 rounded-xl hover:bg-gray-50 hover:shadow-lg transition-all duration-200 cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                onClick={confirmDeleteEducation}
                                className="px-6 py-3 font-semibold bg-gradient-to-r from-red-500 to-pink-600 text-white rounded-xl hover:from-red-600 hover:to-pink-700 hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer"
                            >
                                Xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes fadeIn {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }
                
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
                
                .animate-fadeIn {
                    animation: fadeIn 0.3s ease-out;
                }
                
                .animate-scaleIn {
                    animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                }
            `}</style>
        </div>
    );
};

export default Occupation;