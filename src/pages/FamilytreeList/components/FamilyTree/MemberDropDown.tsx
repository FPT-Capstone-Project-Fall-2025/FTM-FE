import { useAppSelector } from "@/hooks/redux";
import familyTreeService from "@/services/familyTreeService";
import type { PaginationProps } from "@/types/api";
import type { FamilyMemberList } from "@/types/familytree";
import { Check, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";


const MemberDropdown: React.FC<{
    value: string;
    onChange: (member: FamilyMemberList | null) => void;
}> = ({ value, onChange }) => {
    const selectedFamilyTree = useAppSelector(state => state.familyTreeMetaData.selectedFamilyTree)
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState(value);
    const [loading, setLoading] = useState(false);
    const [selectedMember, setSelectedMember] = useState<FamilyMemberList | null>(null);
    const [paginationData, setPaginationData] = useState<PaginationProps>({
        pageIndex: 1,
        pageSize: 100,
        propertyFilters: [
            {
                name: "FTId",
                operation: "EQUAL",
                value: selectedFamilyTree ? selectedFamilyTree.id : ''
            },
            {
                name: "isDeleted",
                operation: "EQUAL",
                value: 'false'
            }
        ],
        totalItems: 0,
        totalPages: 0,
    });
    const [familyMemberList, setFamilyMemberList] = useState<FamilyMemberList[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const loadMembers = async () => {
        setLoading(true);
        try {
            const res = await familyTreeService.getFamilyTreeMembers(paginationData);
            setPaginationData(pre => ({
                ...pre,
                ...res.data
            }));
            setFamilyMemberList(res.data.data);
        } catch (error) {
            console.error("Failed to fetch members:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadMembers();
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filteredMembers = familyMemberList.filter(member =>
        member.fullname.toLowerCase().includes(filter.toLowerCase())
    );

    const handleSelectMember = (member: FamilyMemberList) => {
        setSelectedMember(member);
        setFilter(member.fullname);
        onChange(member);
        setIsOpen(false);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFilter(e.target.value);
        setIsOpen(true);
        if (!e.target.value) {
            setSelectedMember(null);
            onChange(null);
        }
    };

    return (
        <div ref={dropdownRef} className="relative w-full">
            <input
                type="text"
                value={filter}
                onChange={handleInputChange}
                onFocus={() => setIsOpen(true)}
                placeholder="Nhập tên thành viên..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-base"
            />

            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-4 text-gray-500">
                            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                            Đang tải dữ liệu...
                        </div>
                    ) : filteredMembers.length > 0 ? (
                        filteredMembers.map(member => (
                            <div
                                key={member.id}
                                onClick={() => handleSelectMember(member)}
                                className={`flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 ${selectedMember?.id === member.id
                                        ? 'bg-black text-white hover:bg-black'
                                        : ''
                                    }`}
                            >
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-red-400 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
                                    {member.fullname.charAt(0)}
                                </div>
                                <span className="flex-1 text-base">{member.fullname}</span>
                                {selectedMember?.id === member.id && (
                                    <Check size={20} className="flex-shrink-0" />
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="px-4 py-3 text-gray-500 text-center">
                            Không tìm thấy thành viên
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default MemberDropdown;