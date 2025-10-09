import React, { useState } from 'react';
import { Edit2, Plus, Trash2 } from 'lucide-react';
import CustomDatePicker from '@/components/ui/DatePicker';

interface WorkExperience {
    id: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
}

interface Education {
    id: string;
    school: string;
    major: string;
    startMonth: string;
    startYear: string;
    endMonth: string;
    endYear: string;
    description: string;
}

const Occupation: React.FC = () => {
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

    const initialEducations: Education[] = [
        {
            id: '1',
            school: 'ABC Academy',
            major: 'Sample Major Name',
            startMonth: 'Tháng Tám',
            startYear: '2015',
            endMonth: 'Tháng Sáu',
            endYear: '2019',
            description: ''
        }
    ];

    const [workExperiences, setWorkExperiences] = useState<WorkExperience[]>(initialWorkExperiences);
    const [educations, setEducations] = useState<Education[]>(initialEducations);
    const [originalWorkExperiences, setOriginalWorkExperiences] = useState<WorkExperience[]>(initialWorkExperiences);
    const [originalEducations, setOriginalEducations] = useState<Education[]>(initialEducations);

    const [editingWork, setEditingWork] = useState<string | null>(null);
    const [editingEducation, setEditingEducation] = useState<string | null>(null);

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
        setEditingEducation(editingEducation === id ? null : id);
    };

    const handleWorkChange = (id: string, field: keyof WorkExperience, value: string) => {
        setWorkExperiences(prev =>
            prev.map(work => work.id === id ? { ...work, [field]: value } : work)
        );
    };

    const handleEducationChange = (id: string, field: keyof Education, value: string) => {
        setEducations(prev =>
            prev.map(edu => edu.id === id ? { ...edu, [field]: value } : edu)
        );
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
        const newEdu: Education = {
            id: Date.now().toString(),
            school: '',
            major: '',
            startMonth: '',
            startYear: '',
            endMonth: '',
            endYear: '',
            description: ''
        };
        setEducations([...educations, newEdu]);
        setEditingEducation(newEdu.id);
    };

    const handleCancel = () => {
        if (hasActiveEditing()) {
            // Close all editing fields
            setEditingWork(null);
            setEditingEducation(null);
            // Revert to original data
            setWorkExperiences(originalWorkExperiences);
            setEducations(originalEducations);
        }
    };

    const handleSave = () => {
        // Save the current state as the new original
        setOriginalWorkExperiences(workExperiences);
        setOriginalEducations(educations);
        // Close all editing fields
        setEditingWork(null);
        setEditingEducation(null);
        // Here you would typically make an API call to save the data
        console.log('Saved:', { workExperiences, educations });
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
        if (window.confirm('Bạn có chắc chắn muốn xóa học vấn này?')) {
            setEducations(prev => prev.filter(edu => edu.id !== id));
            if (editingEducation === id) {
                setEditingEducation(null);
            }
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
                                <div className="flex gap-4">
                                    <div className="w-20 h-20 border-2 border-gray-300 rounded flex items-center justify-center flex-shrink-0">
                                        <div className="w-full h-full flex items-center justify-center">
                                            <svg className="w-12 h-12 text-gray-400" viewBox="0 0 100 100">
                                                <line x1="10" y1="10" x2="90" y2="90" stroke="currentColor" strokeWidth="2" />
                                                <line x1="90" y1="10" x2="10" y2="90" stroke="currentColor" strokeWidth="2" />
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="flex-1">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex-1">
                                                {editingEducation === edu.id ? (
                                                    <div className="space-y-2">
                                                        <input
                                                            type="text"
                                                            value={edu.school}
                                                            onChange={(e) => handleEducationChange(edu.id, 'school', e.target.value)}
                                                            className="w-full font-semibold border border-gray-300 rounded px-3 py-2"
                                                            placeholder="Tên trường"
                                                        />
                                                        <input
                                                            type="text"
                                                            value={edu.major}
                                                            onChange={(e) => handleEducationChange(edu.id, 'major', e.target.value)}
                                                            className="w-full text-sm border border-gray-300 rounded px-3 py-2"
                                                            placeholder="Chuyên ngành"
                                                        />
                                                        <div className="flex gap-2 items-center">
                                                            <input
                                                                type="text"
                                                                value={edu.startMonth}
                                                                onChange={(e) => handleEducationChange(edu.id, 'startMonth', e.target.value)}
                                                                className="flex-1 text-sm border border-gray-300 rounded px-3 py-2"
                                                                placeholder="Tháng"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={edu.startYear}
                                                                onChange={(e) => handleEducationChange(edu.id, 'startYear', e.target.value)}
                                                                className="w-20 text-sm border border-gray-300 rounded px-3 py-2"
                                                                placeholder="Năm"
                                                            />
                                                            <span>-</span>
                                                            <input
                                                                type="text"
                                                                value={edu.endMonth}
                                                                onChange={(e) => handleEducationChange(edu.id, 'endMonth', e.target.value)}
                                                                className="flex-1 text-sm border border-gray-300 rounded px-3 py-2"
                                                                placeholder="Tháng"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={edu.endYear}
                                                                onChange={(e) => handleEducationChange(edu.id, 'endYear', e.target.value)}
                                                                className="w-20 text-sm border border-gray-300 rounded px-3 py-2"
                                                                placeholder="Năm"
                                                            />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <h3 className="font-semibold">{edu.school}</h3>
                                                        <p className="text-sm text-gray-600">{edu.major}</p>
                                                        <p className="text-sm text-gray-600">
                                                            {edu.startMonth} {edu.startYear} - {edu.endMonth} {edu.endYear}
                                                        </p>
                                                    </>
                                                )}
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

                                        <div className="mt-3">
                                            <label className="font-semibold text-sm mb-2 block">Mô tả</label>
                                            {editingEducation === edu.id ? (
                                                <textarea
                                                    value={edu.description}
                                                    onChange={(e) => handleEducationChange(edu.id, 'description', e.target.value)}
                                                    className="w-full h-24 border border-gray-300 rounded px-3 py-2 text-sm"
                                                    placeholder="Nhập mô tả..."
                                                />
                                            ) : (
                                                <div className="h-24 border border-gray-300 rounded px-3 py-2 text-sm text-gray-500">
                                                    {edu.description || ''}
                                                </div>
                                            )}
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
                        disabled={!hasActiveEditing()}
                        className={`px-6 py-2 border border-gray-300 rounded ${
                            hasActiveEditing() 
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
        </div>
    );
};

export default Occupation;