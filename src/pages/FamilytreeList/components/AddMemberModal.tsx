import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import type { FamilyMemberList } from "@/types/familytree";
import familyTreeService from "@/services/familyTreeService";
import type { PaginationProps } from "@/types/api";

interface AddMemberModalProps {
    isOpen: boolean;
    ftId: string | undefined;
    onClose: () => void;
    onConfirm: (memberId: string, featureCode: string, methodsList: string[]) => Promise<void>;
    existingMemberIds: string[];
}

const FEATURE_CODES = [
    { label: "Thành viên", value: "MEMBER" },
    { label: "Sự kiện", value: "EVENT" },
    { label: "Quỹ", value: "FUND" }
];

const METHODS = [
    { label: "Truy cập Đọc", value: "VIEW" },
    { label: "Quyền Ghi / Sửa", value: "UPDATE" },
    { label: "Quyền Tạo", value: "ADD" },
    { label: "Quyền Xóa", value: "DELETE" }
];

const AddMemberModal: React.FC<AddMemberModalProps> = ({
    isOpen,
    ftId,
    onClose,
    onConfirm,
    existingMemberIds
}) => {
    const [members, setMembers] = useState<FamilyMemberList[]>([]);
    const [selectedMemberId, setSelectedMemberId] = useState<string>("");
    const [selectedFeatureCode, setSelectedFeatureCode] = useState<string>("MEMBER");
    const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (isOpen && ftId) {
            fetchMembers();
        }
    }, [isOpen, ftId]);

    const fetchMembers = async () => {
        setLoading(true);
        setError(null);
        try {
            const paginationProps: PaginationProps = {
                pageIndex: 1,
                pageSize: 100,
                propertyFilters: [
                    {
                        name: "FTId",
                        operation: "EQUAL",
                        value: ftId || ''
                    }
                ],
                totalItems: 0,
                totalPages: 0
            };

            const res = await familyTreeService.getFamilyTreeMembers(paginationProps);
            const allMembers = (res.data as any)?.data || [];

            // Filter out members that already have permissions
            const availableMembers = allMembers.filter(
                (member: FamilyMemberList) => !existingMemberIds.includes(member.id)
            );

            setMembers(availableMembers);
            if (availableMembers.length > 0) {
                setSelectedMemberId(availableMembers[0].id);
            }
        } catch (err) {
            console.error("Failed to fetch members:", err);
            setError("Không thể tải danh sách thành viên");
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!selectedMemberId) {
            setError("Vui lòng chọn thành viên");
            return;
        }

        if (!selectedFeatureCode) {
            setError("Vui lòng chọn tính năng");
            return;
        }

        setSubmitting(true);
        try {
            await onConfirm(selectedMemberId, selectedFeatureCode, selectedMethods);
            setSelectedMemberId("");
            setSearchTerm("");
            setSelectedFeatureCode("MEMBER");
            setSelectedMethods([]);
            onClose();
        } catch (err) {
            console.error("Failed to add member:", err);
            setError("Lỗi khi thêm thành viên");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const filteredMembers = members.filter(member =>
        member.fullname.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] flex flex-col">
                {/* Header - Fixed */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Thêm thành viên quản lý quyền
                    </h3>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
                        </div>
                    ) : members.length === 0 ? (
                        <div className="py-8 text-center text-gray-500">
                            Không có thành viên nào để thêm
                        </div>
                    ) : (
                        <>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Tìm kiếm thành viên
                                </label>
                                <input
                                    type="text"
                                    placeholder="Nhập tên thành viên..."
                                    value={searchTerm}
                                    onChange={e => {
                                        setSearchTerm(e.target.value);
                                        // Auto-select first matching member
                                        const filtered = members.filter(m =>
                                            m.fullname.toLowerCase().includes(e.target.value.toLowerCase())
                                        );
                                        if (filtered.length > 0 && !selectedMemberId && filtered[0]) {
                                            setSelectedMemberId(filtered[0].id);
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Chọn thành viên
                                </label>
                                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-300 rounded-md p-2 bg-gray-50">
                                    {filteredMembers.length === 0 ? (
                                        <div className="py-4 text-center text-gray-500 text-sm">
                                            Không tìm thấy thành viên phù hợp
                                        </div>
                                    ) : (
                                        filteredMembers.map(member => (
                                            <div
                                                key={member.id}
                                                onClick={() => {
                                                    setSelectedMemberId(member.id);
                                                    setSearchTerm("");
                                                }}
                                                className={`p-3 rounded-md cursor-pointer flex items-center space-x-3 transition-colors ${selectedMemberId === member.id
                                                    ? 'bg-blue-200 border-l-4 border-blue-600'
                                                    : 'hover:bg-blue-100'
                                                    }`}
                                            >
                                                {member.filePath ? (
                                                    <img
                                                        src={member.filePath}
                                                        alt={member.fullname}
                                                        className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                                                    />
                                                ) : (
                                                    <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center flex-shrink-0 text-xs font-semibold text-gray-600">
                                                        {member.fullname.charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                                <span className="text-sm text-gray-900 font-medium">
                                                    {member.fullname}
                                                </span>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Chọn tính năng
                                </label>
                                <div className="space-y-2">
                                    {FEATURE_CODES.map(feature => (
                                        <label
                                            key={feature.value}
                                            className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${selectedFeatureCode === feature.value
                                                ? 'bg-blue-100 border border-blue-400'
                                                : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="featureCode"
                                                value={feature.value}
                                                checked={selectedFeatureCode === feature.value}
                                                onChange={e => setSelectedFeatureCode(e.target.value)}
                                                className="w-4 h-4 text-blue-600 cursor-pointer"
                                            />
                                            <span className="ml-2 text-sm font-medium text-gray-700">
                                                {feature.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Chọn quyền
                                </label>
                                <div className="space-y-2">
                                    {METHODS.map(method => (
                                        <label
                                            key={method.value}
                                            className={`flex items-center p-2 rounded-md cursor-pointer transition-colors ${selectedMethods.includes(method.value)
                                                ? 'bg-green-100 border border-green-400'
                                                : 'bg-gray-50 border border-gray-200 hover:bg-gray-100'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                value={method.value}
                                                checked={selectedMethods.includes(method.value)}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        setSelectedMethods([...selectedMethods, method.value]);
                                                    } else {
                                                        setSelectedMethods(selectedMethods.filter(m => m !== method.value));
                                                    }
                                                }}
                                                className="w-4 h-4 text-green-600 cursor-pointer"
                                            />
                                            <span className="ml-2 text-sm font-medium text-gray-700">
                                                {method.label}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer - Fixed */}
                {!loading && members.length > 0 && (
                    <div className="border-t border-gray-200 p-6 bg-white flex-shrink-0 flex justify-end space-x-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting || !selectedMemberId}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            <span>{submitting ? "Đang thêm..." : "Thêm"}</span>
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default AddMemberModal;
