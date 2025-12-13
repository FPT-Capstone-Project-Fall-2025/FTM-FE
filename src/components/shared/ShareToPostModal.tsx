import React, { useState, useEffect } from 'react';
import { X, Loader2, Send } from 'lucide-react';
import { toast } from 'react-toastify';
import postService, { type CreatePostData } from '@/services/postService';
import { embedSourceMetadata } from '@/utils/postMetadata';
import { generateCampaignCard, generateEventCard } from '@/utils/PostCardGenerator';

interface ShareToPostModalProps {
    isOpen: boolean;
    onClose: () => void;
    familyTreeId: string;
    gpMemberId: string;
    shareableItem: {
        type: 'campaign' | 'event';
        id: string; // Source ID (event ID or campaign ID)
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
    const [postContent, setPostContent] = useState<string>(
        shareableItem.type === 'campaign'
            ? `💙 Hãy cùng chung tay ủng hộ!\n\n#ChiếnDịchGayQuỹ #GiaTộc`
            : `🎉 Đừng bỏ lỡ sự kiện này!\n\n#SựKiệnGiaTộc #GắnKếtYêuThương`
    );
    const [additionalMessage, setAdditionalMessage] = useState<string>('');
    const [isSharing, setIsSharing] = useState<boolean>(false);
    const [generatedImage, setGeneratedImage] = useState<File | null>(null);
    const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
    const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);

    if (!isOpen) return null;

    // Generate image card when modal opens or shareableItem changes
    useEffect(() => {
        if (!isOpen) return;

        const generateImage = async () => {
            setIsGeneratingImage(true);
            try {
                let blob: Blob;

                if (shareableItem.type === 'campaign') {
                    // Extract campaign data
                    const details = shareableItem.details;
                    blob = await generateCampaignCard({
                        name: shareableItem.title.replace('🎯 [Chiến dịch] ', ''),
                        description: details.campaignDescription || '',
                        raised: `${(details.currentBalance || 0).toLocaleString('vi-VN')}đ`,
                        goal: `${(details.fundGoal || 0).toLocaleString('vi-VN')}đ`,
                        progress: details.progress || 0,
                        donors: details.totalDonations || 0,
                        daysLeft: details.daysRemaining,
                        imageUrl: shareableItem.imageUrl || undefined
                    });
                } else {
                    // Extract event data
                    const details = shareableItem.details;
                    blob = await generateEventCard({
                        name: shareableItem.title.replace('🎊 [Sự kiện] ', ''),
                        description: details.description || '',
                        date: details.startTime ? new Date(details.startTime).toLocaleDateString('vi-VN') : '',
                        time: details.startTime && details.endTime
                            ? `${new Date(details.startTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - ${new Date(details.endTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                            : undefined,
                        location: details.address || details.locationName || undefined,
                        participants: details.members?.length || undefined,
                        isLunar: details.isLunar || false,
                        imageUrl: shareableItem.imageUrl || undefined
                    });
                }

                // Convert blob to File
                const file = new File([blob], `${shareableItem.type}-card.png`, { type: 'image/png' });
                setGeneratedImage(file);

                // Create preview URL
                const previewUrl = URL.createObjectURL(blob);
                setImagePreviewUrl(previewUrl);
            } catch (error) {
                console.error('Error generating image:', error);
                toast.error('Không thể tạo hình ảnh xem trước');
            } finally {
                setIsGeneratingImage(false);
            }
        };

        generateImage();

        // Cleanup preview URL on unmount
        return () => {
            if (imagePreviewUrl) {
                URL.revokeObjectURL(imagePreviewUrl);
            }
        };
    }, [isOpen, shareableItem]);


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

            // Embed source metadata for navigation
            const metadata: any = {
                type: shareableItem.type,
                id: shareableItem.id,
                familyTreeId: familyTreeId, // Include familyTreeId for both event and campaign
                title: shareableItem.title
            };

            const contentWithMetadata = embedSourceMetadata(finalContent, metadata);

            const postData: CreatePostData = {
                FTId: familyTreeId,
                Title: postTitle,
                Content: contentWithMetadata,
                FTMemberId: gpMemberId,
                Status: 1,
            };

            // Attach generated image card if available
            if (generatedImage) {
                postData.Files = [generatedImage];
                postData.Captions = ['']; // Empty caption since content is in post text
            }

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
        <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.stopPropagation()}
        >
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

                        {/* Generated Image Card Preview */}
                        {isGeneratingImage ? (
                            <div className="mb-3 rounded-lg bg-gray-100 h-64 flex items-center justify-center">
                                <div className="text-center">
                                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-2" />
                                    <p className="text-sm text-gray-600">Đang tạo hình ảnh...</p>
                                </div>
                            </div>
                        ) : imagePreviewUrl ? (
                            <div className="mb-3 rounded-lg overflow-hidden shadow-lg">
                                <img
                                    src={imagePreviewUrl}
                                    alt="Generated Card Preview"
                                    className="w-full h-auto"
                                />
                            </div>
                        ) : null}

                        {/* Content Preview */}
                        <div className="text-sm text-gray-700 whitespace-pre-wrap">
                            {additionalMessage && (
                                <div className="mb-2 pb-2 border-b border-gray-200">
                                    <p className="font-medium">{additionalMessage}</p>
                                </div>
                            )}
                            <textarea
                                value={postContent}
                                onChange={(e) => setPostContent(e.target.value)}
                                className="w-full bg-transparent border-none focus:ring-0 p-0 text-gray-700 resize-none"
                                rows={10}
                                placeholder="Nội dung bài viết..."
                            />
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
