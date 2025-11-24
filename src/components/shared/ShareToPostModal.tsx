import React, { useState } from 'react';
import { X, Loader2, Globe, Lock, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import postService, { type CreatePostData } from '@/services/postService';

interface ShareToPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    familyTreeId: string;
    gpMemberId: string;
    shareableItem: {
        type: 'campaign' | 'event';
        title: string;
        description?: string | null;
        imageUrl?: string | null;
        details: any; // Campaign or Event specific data
    };
    onShareSuccess?: () => void;
}

const ShareToPostModal: React.FC<ShareToPostModalProps> = ({
    isOpen,
    onClose,
    familyTreeId,
    gpMemberId,
    shareableItem,
    onShareSuccess
}) => {
    const [postTitle] = useState<string>(shareableItem.title);
    const [postContent] = useState<string>(shareableItem.description || '');
    const [additionalMessage, setAdditionalMessage] = useState<string>('');
    const [status, setStatus] = useState<number>(1); // 1 = Public, 0 = Private
    const [isSharing, setIsSharing] = useState<boolean>(false);

    if (!isOpen) return null;

    const handleShare = async () => {
        if (!postContent.trim() && !additionalMessage.trim()) {
            toast.error('Vui lòng nhập nội dung bài viết');
            return;
        }

        setIsSharing(true);

        try {
            // Combine generated content with user's additional message
            const finalContent = additionalMessage.trim()
                ? `${additionalMessage}\n\n${postContent}`
                : postContent;

            const postData: CreatePostData = {
                FTId: familyTreeId,
                Title: postTitle,
                Content: finalContent,
                FTMemberId: gpMemberId,
                Status: status,
            };

            // If there's an image URL, we would need to fetch and convert it to a File
            // For now, we'll just post the text content
            // TODO: Handle image attachment if needed

            const response = await postService.createPost(postData);

            if (response.success || response.status) {
                toast.success('Đã chia sẻ lên bảng tin thành công!');
                onShareSuccess?.();
                onClose();
            } else {
                throw new Error(response.message || 'Không thể chia sẻ');
            }
        } catch (error: any) {
            console.error('Share to post error:', error);
            const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi chia sẻ';
            toast.error(errorMessage);
        } finally {
            setIsSharing(false);
        }
    };

    const handleClose = () => {
        if (!isSharing) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
                    <div className="flex items-center gap-3">
                        <Send className="w-6 h-6" />
                        <h3 className="text-xl font-bold">
                            Chia sẻ {shareableItem.type === 'campaign' ? 'Chiến dịch' : 'Sự kiện'} lên Bảng tin
                        </h3>
                    </div>
                    <button
                        onClick={handleClose}
                        disabled={isSharing}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors disabled:opacity-50"
                        type="button"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    {/* Additional Message Input */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Thêm lời nhắn của bạn (tùy chọn)
                        </label>
                        <textarea
                            value={additionalMessage}
                            onChange={(e) => setAdditionalMessage(e.target.value)}
                            placeholder="Viết điều gì đó về chia sẻ này..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                            rows={3}
                            disabled={isSharing}
                        />
                    </div>

                    {/* Preview Section */}
                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <p className="text-xs text-gray-500 uppercase font-semibold mb-3">Xem trước nội dung</p>

                        {/* Title */}
                        <h4 className="text-lg font-bold text-gray-900 mb-2">{postTitle}</h4>

                        {/* Image Preview */}
                        {shareableItem.imageUrl && (
                            <div className="mb-3 rounded-lg overflow-hidden">
                                <img
                                    src={shareableItem.imageUrl}
                                    alt="Preview"
                                    className="w-full h-48 object-cover"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).style.display = 'none';
                                    }}
                                />
                            </div>
                        )}

                        {/* Content Preview */}
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                            {additionalMessage && (
                                <div className="mb-2 pb-2 border-b border-gray-200">
                                    <p className="font-medium">{additionalMessage}</p>
                                </div>
                            )}
                            <p>{postContent}</p>
                        </div>
                    </div>

                    {/* Privacy Settings */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Quyền riêng tư
                        </label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => setStatus(1)}
                                disabled={isSharing}
                                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${status === 1
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                    } disabled:opacity-50`}
                            >
                                <Globe className="w-4 h-4" />
                                <span className="font-semibold">Công khai</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setStatus(0)}
                                disabled={isSharing}
                                className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors flex items-center justify-center gap-2 ${status === 0
                                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                                    : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                                    } disabled:opacity-50`}
                            >
                                <Lock className="w-4 h-4" />
                                <span className="font-semibold">Chỉ mình tôi</span>
                            </button>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            onClick={handleClose}
                            disabled={isSharing}
                            className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                            type="button"
                        >
                            Hủy
                        </button>
                        <button
                            onClick={handleShare}
                            disabled={isSharing}
                            className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            type="button"
                        >
                            {isSharing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Đang chia sẻ...
                                </>
                            ) : (
                                <>
                                    <Send className="w-5 h-5" />
                                    Chia sẻ ngay
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ShareToPostModal;
