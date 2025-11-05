import { useEffect, useRef, useState } from 'react';
import {
    X,
    Edit,
    Save,
    Calendar,
    MapPin,
    Phone,
    Mail,
    User,
    FileText,
    Image,
    Trash2,
    Plus,
    Video,
    File,
} from 'lucide-react';
import type { FamilyNode, FileProps, UpdateFamilyNode } from '@/types/familytree';
import familyTreeService from '@/services/familyTreeService';
import { toast } from 'react-toastify';

interface MemberDetailPageProps {
    ftId: string | undefined;
    memberId: string | undefined;
    onClose: () => void;
}

const MemberDetailPage: React.FC<MemberDetailPageProps> = ({
    ftId,
    memberId,
    onClose,
}) => {
    const [member, setMember] = useState<FamilyNode | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [activeTab, setActiveTab] = useState<'info' | 'media' | 'story'>('info');
    const [editedMember, setEditedMember] = useState<FamilyNode | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedFileIndex, setSelectedFileIndex] = useState<number | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const fetchMemberDetail = async () => {
            if (!ftId || !memberId) return;
            setLoading(true);
            setError(null);
            try {
                const { data } = await familyTreeService.getFamilyTreeMemberById(ftId, memberId);

                // Extract avatar & other files
                let avatarFilePath: string | null = null;
                let otherFiles = data.ftMemberFiles || [];

                if (Array.isArray(data.ftMemberFiles)) {
                    const avatarFile = data.ftMemberFiles.find(
                        (f: any) =>
                            typeof f.title === 'string' &&
                            f.title.trim().toLowerCase() === `avatar${data.id}`.toLowerCase()
                    );

                    if (avatarFile) {
                        avatarFilePath = avatarFile.filePath || null;
                        otherFiles = data.ftMemberFiles.filter((f: any) => f !== avatarFile);
                    }
                }

                const processedData = {
                    ...data,
                    picture: avatarFilePath || data.picture || null,
                    ftMemberFiles: otherFiles,
                };

                setMember(processedData);
                setEditedMember({ ...processedData });
            } catch (err) {
                console.error(err);
                setError('Không thể tải thông tin thành viên');
            } finally {
                setLoading(false);
            }
        };

        fetchMemberDetail();
    }, [ftId, memberId]);

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !editedMember || !memberId) return;

        // Revoke previous blob URL if any
        if (editedMember.picture?.startsWith('blob:')) {
            URL.revokeObjectURL(editedMember.picture);
        }

        // Create new avatar file object
        const newUrl = URL.createObjectURL(file);
        const avatarFile: FileProps = {
            title: `Avatar${memberId}`,
            description: '',
            fileType: file.type,
            file,
            thumbnail: newUrl,
            content: '',
        };

        // Replace existing avatar in ftMemberFiles or append it
        const updatedFiles = editedMember.ftMemberFiles.filter(
            (f) => f.title !== `Avatar${memberId}`
        );
        updatedFiles.push(avatarFile);

        setEditedMember((prev) =>
            prev ? { ...prev, picture: newUrl, ftMemberFiles: updatedFiles } : prev
        );

        // Reset input
        if (avatarInputRef.current) avatarInputRef.current.value = '';
    };

    const startEdit = () => {
        setIsEditing(true);
        setEditedMember(member ? { ...member } : null);
    };

    const cancelEdit = () => {
        // Revoke blob URLs
        if (editedMember?.picture?.startsWith('blob:')) {
            URL.revokeObjectURL(editedMember.picture);
        }
        editedMember?.ftMemberFiles.forEach((f) => {
            if (f.thumbnail?.startsWith('blob:')) {
                URL.revokeObjectURL(f.thumbnail);
            }
        });
        setIsEditing(false);
        setEditedMember(member ? { ...member } : null);
        setError(null);
    };

    const handleSave = async () => {
        if (!ftId || !member || !editedMember || !memberId) return;

        setLoading(true);
        setError(null);

        try {
            // ---------- 1. Detect field-level changes ----------
            const excludedKeys = ['ftMemberFiles', 'id', 'picture', 'avatar'] as const;
            const fieldDiff: Partial<FamilyNode> = {};

            const allKeys = new Set([...Object.keys(member), ...Object.keys(editedMember)]);
            for (const key of allKeys) {
                if (excludedKeys.includes(key as any)) continue;
                const k = key as keyof Omit<FamilyNode, 'ftMemberFiles' | 'id' | 'picture' | 'avatar'>;
                if (member[k] !== editedMember[k]) {
                    (fieldDiff as any)[k] = editedMember[k];
                }
            }

            // ---------- 2. Detect file/media changes ----------
            const originalFiles = member.ftMemberFiles || [];
            const editedFiles = editedMember.ftMemberFiles || [];

            const hasFileChanges =
                editedFiles.length !== originalFiles.length ||
                editedFiles.some((edited, idx) => {
                    const original = originalFiles[idx];
                    if (!original) return true;
                    return (
                        edited.title !== original.title ||
                        edited.description !== original.description ||
                        edited.file !== original.file ||
                        edited.thumbnail !== original.thumbnail ||
                        edited.fileType !== original.fileType ||
                        edited.content !== original.content
                    );
                });

            // ---------- 3. Detect avatar change (two possible sources) ----------
            // a) editedMember.avatar field contains a File-like object
            const avatarFromField =
                editedMember.avatar &&
                    typeof editedMember.avatar === 'object' &&
                    'name' in editedMember.avatar &&
                    'type' in editedMember.avatar &&
                    'size' in editedMember.avatar
                    ? (editedMember.avatar as File)
                    : null;

            // b) avatar may be present as a special entry inside editedMember.ftMemberFiles (title === `Avatar${memberId}`)
            const avatarFileEntry = editedFiles.find(
                f => typeof f.title === 'string' && f.title.trim().toLowerCase() === `avatar${memberId}`.toLowerCase()
            );

            const avatarFromFileEntry =
                avatarFileEntry &&
                    avatarFileEntry.file &&
                    typeof avatarFileEntry.file === 'object' &&
                    'name' in avatarFileEntry.file &&
                    'type' in avatarFileEntry.file &&
                    'size' in avatarFileEntry.file
                    ? (avatarFileEntry.file as File)
                    : null;

            // If either source has a new File, we consider avatar changed.
            const hasAvatarChange = !!(avatarFromField || avatarFromFileEntry);

            const hasFieldChanges = Object.keys(fieldDiff).length > 0;

            if (!hasFieldChanges && !hasFileChanges && !hasAvatarChange) {
                toast.info('Không có thay đổi nào được lưu.');
                setIsEditing(false);
                return;
            }

            // ---------- 4. Build payload ----------
            const payload: Partial<UpdateFamilyNode> = {
                ftMemberId: editedMember.id,
                ...fieldDiff,
            };

            // Build ftMemberFiles payload BUT exclude avatar entry (if present)
            if (hasFileChanges) {
                const filesToSend = editedFiles
                    // Filter out avatar entry by title (title may be Avatar{memberId})
                    .filter(file => {
                        if (!file || typeof file.title !== 'string') return true;
                        return file.title.trim().toLowerCase() !== `avatar${memberId}`.toLowerCase();
                    })
                    .map((file) => {
                        const isNewFile =
                            file.file &&
                            typeof file.file === 'object' &&
                            'name' in file.file &&
                            'type' in file.file &&
                            'size' in file.file;

                        return {
                            ...file,
                            // send File objects for new files only
                            file: isNewFile ? file.file : undefined,
                            content: "string",
                            filePath: isNewFile
                                ? undefined
                                : file.filePath || (typeof file.file === 'string' ? file.file : undefined),
                        };
                    });

                // Only include if non-empty
                if (filesToSend.length > 0) {
                    payload.ftMemberFiles = filesToSend;
                } else {
                    // If there are no other files but fileChanges was true because avatar was added/removed,
                    // optionally set empty array so server knows files were cleared.
                    payload.ftMemberFiles = [];
                }
            }

            // Include avatar as standalone binary if there is a new avatar (prefer explicit avatar field first)
            if (avatarFromField) {
                payload.avatar = avatarFromField;
            } else if (avatarFromFileEntry) {
                payload.avatar = avatarFromFileEntry;
            }

            console.log('Payload:', JSON.stringify(payload, (_, value) => {
                if (value && typeof value === 'object' && 'name' in value && 'type' in value && 'size' in value) {
                    return '[File object]';
                }
                return value;
            }, 2));

            // ---------- 5. Send update ----------
            const response = await familyTreeService.updateFamilyNode(ftId, payload);
            const updatedData = response.data;

            // ---------- 6. Separate avatar and other media from response ----------
            let avatarFilePath: string | null = null;
            let otherFiles = updatedData.ftMemberFiles || [];

            if (Array.isArray(updatedData.ftMemberFiles)) {
                const avatarFile = updatedData.ftMemberFiles.find(
                    (f: any) =>
                        typeof f.title === 'string' &&
                        f.title.trim().toLowerCase() === `avatar${updatedData.id}`.toLowerCase()
                );

                if (avatarFile) {
                    avatarFilePath = avatarFile.filePath || null;
                    otherFiles = updatedData.ftMemberFiles.filter((f: any) => f !== avatarFile);
                }
            }

            // ---------- 7. Clean up old blobs ----------
            if (editedMember.picture?.startsWith('blob:')) {
                URL.revokeObjectURL(editedMember.picture);
            }
            editedMember.ftMemberFiles.forEach((f) => {
                if (f.thumbnail?.startsWith('blob:')) {
                    URL.revokeObjectURL(f.thumbnail);
                }
            });

            // ---------- 8. Update state ----------
            const updatedMember = {
                ...updatedData,
                // prefer explicit avatar from response if provided, otherwise fallback to picture
                picture: avatarFilePath || updatedData.picture || null,
                ftMemberFiles: otherFiles,
            };

            setMember(updatedMember);
            setEditedMember({ ...updatedMember });

            toast.success(response.message || 'Cập nhật thành công');
            setIsEditing(false);
        } catch (err: any) {
            console.error('Save error:', err);
            const msg = err?.response?.data?.message || 'Có lỗi xảy ra khi cập nhật';
            toast.error(msg);
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    const setField = <K extends keyof FamilyNode>(field: K, value: FamilyNode[K]) => {
        setEditedMember((prev) => (prev ? { ...prev, [field]: value } : prev));
    };

    const addFiles = () => fileInputRef.current?.click();

    const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || !editedMember) return;
        const newFiles: FileProps[] = Array.from(e.target.files).map((f) => ({
            title: '',
            description: '',
            fileType: f.type,
            file: f,
            thumbnail: f.type.includes('image') ? URL.createObjectURL(f) : null,
            content: '',
        }));
        setField('ftMemberFiles', [...editedMember.ftMemberFiles, ...newFiles]);
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    const deleteFile = (idx: number) => {
        if (!editedMember) return;
        const file = editedMember.ftMemberFiles[idx];
        if (file?.thumbnail?.startsWith('blob:')) URL.revokeObjectURL(file.thumbnail);
        setField(
            'ftMemberFiles',
            editedMember.ftMemberFiles.filter((_, i) => i !== idx)
        );
    };

    const updateFileMeta = (
        idx: number,
        field: keyof Pick<FileProps, 'title' | 'description'>,
        value: string
    ) => {
        if (!editedMember) return;
        const copy = [...editedMember.ftMemberFiles];
        copy[idx] = { ...copy[idx], [field]: value };
        setField('ftMemberFiles', copy);
    };

    const getFileIcon = (type: string) => {
        if (type.includes('video')) return <Video className="w-6 h-6" />;
        if (type.includes('image')) return <Image className="w-6 h-6" />;
        return <File className="w-6 h-6" />;
    };

    const getFileSrc = (item: FileProps) =>
        item.file instanceof File ? URL.createObjectURL(item.file) : item.file;

    if (loading && !member) {
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 shadow-2xl">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-gray-600">Đang tải thông tin...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (error && !member) {
        return (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                            <X className="w-8 h-8 text-red-500" />
                        </div>
                        <p className="text-gray-800 font-semibold">Lỗi</p>
                        <p className="text-gray-600 text-center">{error}</p>
                        <button
                            onClick={onClose}
                            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!member || !editedMember) return null;

    const bgColor = member.gender === 1 ? 'bg-pink-50' : 'bg-blue-50';
    const accentColor = member.gender === 1 ? 'bg-pink-500' : 'bg-blue-500';
    const borderColor = member.gender === 1 ? 'border-pink-200' : 'border-blue-200';
    const data = isEditing ? editedMember : member;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div
                className={`w-full max-w-5xl h-[90vh] ${bgColor} rounded-2xl shadow-2xl overflow-hidden flex flex-col`}
            >
                {/* Header */}
                <div className={`${accentColor} text-white p-6 flex justify-between items-center`}>
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div
                                className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center overflow-hidden cursor-pointer"
                                onClick={() => isEditing && avatarInputRef.current?.click()}
                            >
                                {data.picture ? (
                                    <img
                                        src={data.picture}
                                        alt={data.fullname}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-10 h-10 text-white" />
                                )}
                            </div>

                            {isEditing && (
                                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                                    <Edit className="w-6 h-6 text-white" />
                                </div>
                            )}
                        </div>

                        <input
                            ref={avatarInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarChange}
                        />
                        <div>
                            <h1 className="text-2xl font-bold">{data.fullname}</h1>
                            <p className="text-white/90">{data.ftRole === 'FTMember' ? 'Thành viên' : data.ftRole}</p>
                            <p className="text-sm text-white/80">ID: {data.id}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {!isEditing ? (
                            <button
                                onClick={startEdit}
                                disabled={loading}
                                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg flex items-center gap-2 transition-colors"
                            >
                                <Edit className="w-4 h-4" />
                                Chỉnh sửa
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleSave}
                                    disabled={loading}
                                    className="px-4 py-2 bg-green-500 hover:bg-green-600 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                            Đang lưu...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="w-4 h-4" />
                                            Lưu
                                        </>
                                    )}
                                </button>
                                <button
                                    onClick={cancelEdit}
                                    disabled={loading}
                                    className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
                                >
                                    Hủy
                                </button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            disabled={loading}
                            className="p-2 hover:bg-white/20 rounded-full transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-gray-300 bg-white">
                    {(['info', 'media', 'story'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-6 py-3 font-medium transition-colors ${activeTab === tab
                                ? `${accentColor} text-white`
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {tab === 'info'
                                ? 'Thông tin cá nhân'
                                : tab === 'media'
                                    ? 'Hình ảnh & Video'
                                    : 'Câu chuyện'}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {error && (
                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
                            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                <X className="w-5 h-5 text-red-500" />
                            </div>
                            <div className="flex-1">
                                <p className="text-red-800 font-medium">Lỗi</p>
                                <p className="text-red-600 text-sm">{error}</p>
                            </div>
                            <button
                                onClick={() => setError(null)}
                                className="p-1 hover:bg-red-100 rounded transition-colors"
                            >
                                <X className="w-5 h-5 text-red-400" />
                            </button>
                        </div>
                    )}

                    {activeTab === 'info' && (
                        <div className="grid grid-cols-2 gap-6">
                            <div className={`col-span-2 bg-white rounded-lg p-6 border ${borderColor}`}>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <User className="w-5 h-5" />
                                    Thông tin cơ bản
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        {
                                            label: 'Họ và tên',
                                            field: 'fullname' as const,
                                        },
                                        {
                                            label: 'Giới tính',
                                            field: 'gender' as const,
                                            type: 'select',
                                            options: [
                                                { value: 0, text: 'Nam' },
                                                { value: 1, text: 'Nữ' },
                                            ],
                                        },
                                        {
                                            label: 'Ngày sinh',
                                            field: 'birthday' as const,
                                            type: 'date',
                                        },
                                        {
                                            label: 'Vai trò trong gia đình',
                                            field: 'ftRole' as const,
                                        },
                                    ].map(({ label, field, type, options }) => (
                                        <div key={field}>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {label}
                                            </label>
                                            {isEditing ? (
                                                type === 'select' ? (
                                                    <select
                                                        value={data[field] ?? ''}
                                                        onChange={(e) =>
                                                            setField(field, e.target.value)
                                                        }
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        {options!.map((o) => (
                                                            <option key={o.value} value={o.value}>
                                                                {o.text}
                                                            </option>
                                                        ))}
                                                    </select>
                                                ) : type === 'date' ? (
                                                    <input
                                                        type="date"
                                                        value={data[field] ?? ''}
                                                        onChange={(e) => setField(field, e.target.value || '')}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                ) : (
                                                    <input
                                                        type="text"
                                                        value={data[field] ?? ''}
                                                        onChange={(e) => setField(field, e.target.value || '')}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                )
                                            ) : (
                                                <p className="text-gray-900 flex items-center gap-2">
                                                    {field === 'birthday' && data[field] && (
                                                        <Calendar className="w-4 h-4" />
                                                    )}
                                                    {field === 'gender'
                                                        ? data[field] === 0
                                                            ? 'Nam'
                                                            : 'Nữ'
                                                        : field === 'birthday'
                                                            ? data[field]
                                                                ? new Date(data[field] as string).toLocaleDateString('en-GB')
                                                                : '-'
                                                            : field === 'ftRole'
                                                                ? data[field] === 'FTMember'
                                                                    ? 'Thành viên'
                                                                    : data[field] ?? '-'
                                                                : data[field] ?? '-'}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={`bg-white rounded-lg p-6 border ${borderColor}`}>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <Phone className="w-5 h-5" />
                                    Thông tin liên hệ
                                </h3>
                                <div className="space-y-4">
                                    {[
                                        { label: 'Số điện thoại', field: 'phoneNumber' as const },
                                        { label: 'Email', field: 'email' as const },
                                        { label: 'Địa chỉ', field: 'address' as const, textarea: true },
                                    ].map(({ label, field, textarea }) => (
                                        <div key={field}>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                {label}
                                            </label>
                                            {isEditing ? (
                                                textarea ? (
                                                    <textarea
                                                        rows={3}
                                                        value={data[field] ?? ''}
                                                        onChange={(e) => setField(field, e.target.value || '')}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                ) : (
                                                    <input
                                                        type={field === 'email' ? 'email' : 'tel'}
                                                        value={data[field] ?? ''}
                                                        onChange={(e) => setField(field, e.target.value || '')}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                )
                                            ) : (
                                                <p className="text-gray-900 flex items-center gap-2">
                                                    {field === 'phoneNumber' && <Phone className="w-4 h-4" />}
                                                    {field === 'email' && <Mail className="w-4 h-4" />}
                                                    {field === 'address' && <MapPin className="w-4 h-4 mt-1" />}
                                                    {data[field] ?? '-'}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className={`bg-white rounded-lg p-6 border ${borderColor}`}>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Tình trạng hôn nhân
                                </h3>
                                <div className="col-span-2">
                                    <label className="flex items-center text-sm font-medium text-gray-700">
                                        <input
                                            type="checkbox"
                                            checked={data.isDivorced ?? false}
                                            disabled={!isEditing}
                                            onChange={(e) => setField('isDivorced', e.target.checked)}
                                            className="mr-2"
                                        />
                                        Đã ly hôn
                                    </label>
                                </div>
                            </div>

                            {(data.isDeath || isEditing) && (
                                <div className="col-span-2 bg-gray-100 rounded-lg p-6 border border-gray-300">
                                    <h3 className="text-lg font-semibold mb-4 text-gray-800">
                                        Thông tin qua đời
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="flex items-center text-sm font-medium text-gray-700">
                                                <input
                                                    type="checkbox"
                                                    checked={data.isDeath ?? false}
                                                    disabled={!isEditing}
                                                    onChange={(e) => setField('isDeath', e.target.checked)}
                                                    className="mr-2"
                                                />
                                                Đã qua đời
                                            </label>
                                        </div>

                                        {data.isDeath && (
                                            <>
                                                <div className="col-span-2">
                                                    <label className="flex items-center text-sm font-medium text-gray-700">
                                                        <input
                                                            type="checkbox"
                                                            checked={data.deathDateUnknown ?? false}
                                                            disabled={!isEditing}
                                                            onChange={(e) => {
                                                                setField('deathDateUnknown', e.target.checked);
                                                                if (e.target.checked) setField('deathDate', '');
                                                            }}
                                                            className="mr-2"
                                                        />
                                                        Không rõ ngày mất
                                                    </label>
                                                </div>

                                                {!data.deathDateUnknown && (
                                                    <div>
                                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                                            Ngày mất
                                                        </label>
                                                        {isEditing ? (
                                                            <input
                                                                type="date"
                                                                value={data.deathDate ?? ''}
                                                                onChange={(e) => setField('deathDate', e.target.value || '')}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                            />
                                                        ) : (
                                                            <p className="text-gray-900">
                                                                {data.deathDate
                                                                    ? new Date(data.deathDate).toLocaleDateString('en-GB')
                                                                    : '-'}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}

                                                <div className="col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                                        Địa chỉ an táng
                                                    </label>
                                                    {isEditing ? (
                                                        <textarea
                                                            rows={2}
                                                            value={data.burialAddress ?? ''}
                                                            onChange={(e) => setField('burialAddress', e.target.value || '')}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    ) : (
                                                        <p className="text-gray-900">{data.burialAddress ?? '-'}</p>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'media' && (
                        <div className="space-y-6">
                            <div className={`bg-white rounded-lg p-6 border ${borderColor}`}>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold flex items-center gap-2">
                                        <Image className="w-5 h-5" />
                                        Hình ảnh & Video ({data.ftMemberFiles?.length ?? 0})
                                    </h3>
                                    {isEditing && (
                                        <button
                                            onClick={addFiles}
                                            className={`px-4 py-2 ${accentColor} text-white rounded-lg hover:opacity-90 flex items-center gap-2`}
                                        >
                                            <Plus className="w-4 h-4" />
                                            Thêm file
                                        </button>
                                    )}
                                </div>

                                <input
                                    type="file"
                                    accept="image/*,video/*"
                                    multiple
                                    ref={fileInputRef}
                                    onChange={onFileChange}
                                    className="hidden"
                                />

                                {data.ftMemberFiles?.length ? (
                                    <div className="space-y-4">
                                        {data.ftMemberFiles.map((file, idx) => (
                                            <div
                                                key={idx}
                                                className={`bg-gray-50 rounded-lg p-4 border ${borderColor}`}
                                            >
                                                <div className="flex gap-4">
                                                    <div className="flex-shrink-0">
                                                        {file.thumbnail ? (
                                                            <img
                                                                src={file.thumbnail}
                                                                alt={file.title}
                                                                className="w-32 h-32 rounded-lg object-cover cursor-pointer hover:opacity-80"
                                                                onClick={() => setSelectedFileIndex(idx)}
                                                            />
                                                        ) : (
                                                            <div className="w-32 h-32 rounded-lg bg-gray-200 flex items-center justify-center text-gray-400">
                                                                {getFileIcon(file.fileType ?? '')}
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="flex-1 space-y-3">
                                                        {isEditing ? (
                                                            <>
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                        Tiêu đề
                                                                    </label>
                                                                    <input
                                                                        type="text"
                                                                        value={file.title ?? ''}
                                                                        onChange={(e) =>
                                                                            updateFileMeta(idx, 'title', e.target.value)
                                                                        }
                                                                        placeholder="Nhập tiêu đề..."
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                        Mô tả
                                                                    </label>
                                                                    <textarea
                                                                        rows={2}
                                                                        value={file.description ?? ''}
                                                                        onChange={(e) =>
                                                                            updateFileMeta(idx, 'description', e.target.value)
                                                                        }
                                                                        placeholder="Nhập mô tả..."
                                                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                                                    />
                                                                </div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded">
                                                                        {file.fileType}
                                                                    </span>
                                                                    <button
                                                                        onClick={() => deleteFile(idx)}
                                                                        className="ml-auto px-3 py-1 bg-red-500 text-white text-sm rounded-lg hover:bg-red-600 flex items-center gap-1"
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                        Xóa
                                                                    </button>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <h4 className="font-semibold text-gray-900">
                                                                    {file.title || 'Không có tiêu đề'}
                                                                </h4>
                                                                <p className="text-sm text-gray-600 mt-1">
                                                                    {file.description || 'Không có mô tả'}
                                                                </p>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="text-xs text-gray-500 px-2 py-1 bg-gray-200 rounded">
                                                                        {file.fileType}
                                                                    </span>
                                                                    {file.content && (
                                                                        <span className="text-xs text-gray-400">
                                                                            {file.content}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-12 text-gray-500">
                                        <Image className="w-16 h-16 mx-auto mb-4 opacity-30" />
                                        <p>Chưa có hình ảnh hoặc video nào</p>
                                        {isEditing && (
                                            <button
                                                onClick={addFiles}
                                                className={`mt-4 px-4 py-2 ${accentColor} text-white rounded-lg hover:opacity-90 flex items-center gap-2 mx-auto`}
                                            >
                                                <Plus className="w-4 h-4" />
                                                Thêm file đầu tiên
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            {selectedFileIndex !== null && data.ftMemberFiles?.[selectedFileIndex] && (
                                <div
                                    className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4"
                                    onClick={() => setSelectedFileIndex(null)}
                                >
                                    <div className="relative max-w-4xl max-h-[90vh]">
                                        <button
                                            onClick={() => setSelectedFileIndex(null)}
                                            className="absolute -top-12 right-0 p-2 bg-white/10 hover:bg-white/20 rounded-full"
                                        >
                                            <X className="w-6 h-6 text-white" />
                                        </button>

                                        {data.ftMemberFiles[selectedFileIndex].fileType?.includes(
                                            'video'
                                        ) ? (
                                            <video
                                                src={getFileSrc(data.ftMemberFiles[selectedFileIndex])?.toString()}
                                                controls
                                                className="max-w-full max-h-[90vh] rounded-lg"
                                            />
                                        ) : (
                                            <img
                                                src={getFileSrc(data.ftMemberFiles[selectedFileIndex])?.toString()}
                                                alt={data.ftMemberFiles[selectedFileIndex].title}
                                                className="max-w-full max-h-[90vh] rounded-lg"
                                            />
                                        )}

                                        <div className="mt-4 text-white text-center">
                                            <h3 className="text-lg font-semibold">
                                                {data.ftMemberFiles[selectedFileIndex].title}
                                            </h3>
                                            <p className="text-sm text-gray-300 mt-1">
                                                {data.ftMemberFiles[selectedFileIndex].description}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'story' && (
                        <div className="space-y-6">
                            <div className={`bg-white rounded-lg p-6 border ${borderColor}`}>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5" />
                                    Tiểu sử
                                </h3>
                                {isEditing ? (
                                    <textarea
                                        rows={10}
                                        value={data.storyDescription ?? ''}
                                        onChange={(e) => setField('storyDescription', e.target.value || '')}
                                        placeholder="Viết câu chuyện về cuộc đời của thành viên..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                ) : (
                                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                                        {data.storyDescription || 'Chưa có câu chuyện nào được ghi lại.'}
                                    </p>
                                )}
                            </div>

                            <div className={`bg-white rounded-lg p-6 border ${borderColor}`}>
                                <h3 className="text-lg font-semibold mb-4">Nội dung bổ sung</h3>
                                {isEditing ? (
                                    <textarea
                                        rows={6}
                                        value={data.content ?? ''}
                                        onChange={(e) => setField('content', e.target.value || '')}
                                        placeholder="Thông tin chi tiết khác..."
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                ) : (
                                    <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                                        {data.content || 'Không có nội dung bổ sung.'}
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MemberDetailPage;