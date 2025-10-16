import { Edit2 } from "lucide-react";
import { useState } from "react";

const BasicInfo: React.FC = () => {
    const [formData, setFormData] = useState({
        familyName: 'Gia phả dòng họ X',
        founder: 'Nguyễn Văn A',
        description: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = () => {
        console.log('Form submitted:', formData);
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Family Tree Image */}
            <div className="lg:col-span-1">
                <div className="bg-white rounded-lg border-2 border-dashed border-gray-300 aspect-square flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors relative group">
                    <svg className="w-32 h-32 text-gray-400" viewBox="0 0 100 100" fill="none">
                        <line x1="20" y1="20" x2="80" y2="80" stroke="currentColor" strokeWidth="2" />
                        <line x1="80" y1="20" x2="20" y2="80" stroke="currentColor" strokeWidth="2" />
                    </svg>
                    <div className="absolute inset-0 bg-gray/50 group-hover:bg-opacity-10 rounded-lg transition-all flex items-center justify-center">
                        <Edit2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                </div>
            </div>

            {/* Form Section */}
            <div className="lg:col-span-2 space-y-6">
                <div>
                    <label htmlFor="familyName" className="block text-sm font-medium text-gray-700 mb-2">
                        Tên Gia Phả
                    </label>
                    <input
                        type="text"
                        id="familyName"
                        name="familyName"
                        value={formData.familyName}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="Nhập tên gia phả"
                    />
                </div>

                <div>
                    <label htmlFor="founder" className="block text-sm font-medium text-gray-700 mb-2">
                        Người sở hữu
                    </label>
                    <input
                        type="text"
                        id="founder"
                        name="founder"
                        value={formData.founder}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                        placeholder="Nhập tên người sở hữu"
                    />
                </div>

                <div>
                    <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Ghi chú khác
                    </label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={6}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                        placeholder="Nhập ghi chú"
                    />
                </div>

                <div className="flex gap-3 justify-end pt-4">
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-6 py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-900 transition-colors"
                    >
                        Chính sửa
                    </button>
                </div>
            </div>
        </div>
    );
};

export default BasicInfo;