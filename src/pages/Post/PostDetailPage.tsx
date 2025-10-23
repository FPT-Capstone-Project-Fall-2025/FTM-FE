import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import defaultPicture from '@/assets/dashboard/default-avatar.png';
import { MessageCircle, Send, X, ThumbsUp, Edit, Save, XCircle, Smile, ChevronLeft, ChevronRight } from 'lucide-react';
import postService from '@/services/postService';
import type { Post as PostType, Comment as CommentType } from '@/types/post';

interface PostDetailPageProps {
  isOpen: boolean;
  post: PostType | null;
  onClose: () => void;
  commentInputs: { [key: string]: string };
  setCommentInputs: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  onLikePost: (id: string, type: 'post' | 'comment', postId?: string) => void;
  onCommentSubmit: (postId: string) => void;
  onEditPost?: (postId: string, newContent: string) => void;
  onUpdateComments?: (postId: string, comments: CommentType[]) => void;
  CommentItem: React.FC<{
    comment: CommentType;
    postId: string;
    depth?: number;
    maxDepth?: number;
  }>;
}

const PostDetailPage: React.FC<PostDetailPageProps> = ({
  isOpen,
  post,
  onClose,
  commentInputs,
  setCommentInputs,
  onLikePost,
  onCommentSubmit,
  onEditPost,
  onUpdateComments,
  CommentItem
}) => {
  const { id: groupId } = useParams<{ id: string }>();
  const { user } = useAppSelector(state => state.auth);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Common emojis list
  const commonEmojis = [
    '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
    '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
    '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
    '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
    '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
    '🤧', '🥵', '🥶', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐',
    '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦',
    '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞',
    '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '👍', '👎',
    '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘',
    '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
    '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '🎉', '🎊'
  ];

  // Handle emoji selection
  const handleEmojiSelect = (emoji: string) => {
    if (post) {
      setCommentInputs(prev => ({
        ...prev,
        [post.id]: (prev[post.id] || '') + emoji
      }));
      setShowEmojiPicker(false);
      // Focus back on the input
      const input = document.querySelector(`#comment-input-${post.id}`) as HTMLInputElement;
      if (input) input.focus();
    }
  };

  // Helper function to format time ago
  const formatTimeAgo = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInMinutes < 1) return 'Vừa xong';
    if (diffInMinutes < 60) return `${diffInMinutes} phút trước`;
    if (diffInHours < 24) return `${diffInHours} giờ trước`;
    if (diffInDays < 7) return `${diffInDays} ngày trước`;
    
    return date.toLocaleDateString('vi-VN');
  };

  // Function to transform API comment to Comment interface
  const transformApiComment = (apiComment: any): CommentType => {
    const comment: CommentType = {
      id: apiComment.id || `comment-${Date.now()}-${Math.random()}`,
      gpMemberId: apiComment.gpMemberId,
      author: {
        name: apiComment.authorName || 'Unknown User',
        avatar: apiComment.authorPicture || defaultPicture
      },
      content: apiComment.content || '',
      images: apiComment.attachments?.map((file: any) => file.url) || [],
      timeAgo: formatTimeAgo(apiComment.createdOn || new Date().toISOString()),
      likes: apiComment.totalReactions || 0,
      isLiked: apiComment.isLiked || false,
      replies: apiComment.childComments ? apiComment.childComments.map(transformApiComment) : []
    };
    
    return comment;
  };

  // Load comments from API when popup opens
  useEffect(() => {
    const loadComments = async () => {
      if (isOpen && post?.id) {
        setShowComments(true);
        setLoadingComments(true);
        
        try {
          const result = await postService.getComments(post.id);
          
          console.log('Comments API response:', result);
          
          // Handle both API response formats
          const success = result.success || result.status || (result.statusCode === 200);
          const responseData = result.data as any;
          
          // Handle paginated response or direct array
          const data = Array.isArray(responseData) 
            ? responseData 
            : (responseData?.data || []);
          
          if (success && data) {
            // Transform API comments to Comment interface
            const transformedComments = data.map(transformApiComment);
            
            // Update comments via callback
            if (onUpdateComments) {
              onUpdateComments(post.id, transformedComments);
            }
            
            console.log('Loaded comments:', transformedComments);
          }
        } catch (error) {
          console.error('Error loading comments:', error);
        } finally {
          setLoadingComments(false);
        }
      }
    };

    loadComments();
  }, [isOpen, post?.id]);

  // Automatically show comments when popup opens
  useEffect(() => {
    if (isOpen) {
      setShowComments(true);
    }
  }, [isOpen]);

  if (!isOpen || !post) return null;

  // Check if current user can edit this post
  const canEditPost = user?.name === post.author.name;

  const handleStartEdit = () => {
    setEditContent(post.content);
    setIsEditingPost(true);
  };

  const handleSaveEdit = () => {
    if (onEditPost && editContent.trim()) {
      onEditPost(post.id, editContent.trim());
      setIsEditingPost(false);
    }
  };

  const handleCancelEdit = () => {
    setEditContent('');
    setIsEditingPost(false);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className={`bg-white rounded-lg shadow-xl ${(post.attachments && post.attachments.length > 0) || (post.images && post.images.length > 0) ? 'max-w-7xl w-full' : 'max-w-2xl w-full'} max-h-[90vh] overflow-hidden flex`}>
        {/* Left Side - Post Media (Image/Video) - 50% width */}
        {((post.attachments && post.attachments.length > 0) || (post.images && post.images.length > 0)) && (() => {
          const mediaList = post.attachments || (post.images?.map((url, idx) => ({
            id: `img-${idx}`,
            fileUrl: url,
            fileType: 0,
            caption: undefined,
            createdOn: undefined
          })) || []);
          const mediaCount = mediaList.length;

          return (
            <div className="w-1/2 bg-black flex items-center justify-center min-h-[60vh] relative">
              {/* Current Media Display */}
              {mediaList[currentMediaIndex] && (
                <>
                  {mediaList[currentMediaIndex].fileType === 1 ? (
                    <video
                      key={mediaList[currentMediaIndex].id}
                      src={mediaList[currentMediaIndex].fileUrl}
                      controls
                      preload="metadata"
                      playsInline
                      className="max-w-full max-h-full object-contain"
                    >
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <img
                      key={mediaList[currentMediaIndex].id}
                      src={mediaList[currentMediaIndex].fileUrl}
                      alt={mediaList[currentMediaIndex].caption || "Post media"}
                      className="max-w-full max-h-full object-contain"
                    />
                  )}
                  
                  {/* Caption */}
                  {mediaList[currentMediaIndex].caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-sm p-3">
                      {mediaList[currentMediaIndex].caption}
                    </div>
                  )}
                </>
              )}

              {/* Navigation for multiple media */}
              {mediaCount > 1 && (
                <>
                  {/* Previous Button */}
                  {currentMediaIndex > 0 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentMediaIndex(prev => prev - 1);
                      }}
                      className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full flex items-center justify-center shadow-xl transition-all z-10"
                      aria-label="Previous media"
                    >
                      <ChevronLeft className="w-7 h-7 text-gray-800" />
                    </button>
                  )}

                  {/* Next Button */}
                  {currentMediaIndex < mediaCount - 1 && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentMediaIndex(prev => prev + 1);
                      }}
                      className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full flex items-center justify-center shadow-xl transition-all z-10"
                      aria-label="Next media"
                    >
                      <ChevronRight className="w-7 h-7 text-gray-800" />
                    </button>
                  )}

                  {/* Media Counter */}
                  <div className="absolute top-4 right-4 bg-black bg-opacity-70 text-white text-sm px-4 py-2 rounded-full font-medium">
                    {currentMediaIndex + 1} / {mediaCount}
                  </div>

                  {/* Dots Indicator */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2 bg-black bg-opacity-50 px-3 py-2 rounded-full">
                    {mediaList.map((_, index) => (
                      <button
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation();
                          setCurrentMediaIndex(index);
                        }}
                        className={`transition-all ${
                          index === currentMediaIndex 
                            ? 'w-8 h-2.5 bg-white rounded-full' 
                            : 'w-2.5 h-2.5 bg-white bg-opacity-50 hover:bg-opacity-75 rounded-full'
                        }`}
                        aria-label={`Go to media ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* Right Side - Post Details - 50% when has media, 100% when no media */}
        <div className={`${(post.attachments && post.attachments.length > 0) || (post.images && post.images.length > 0) ? 'w-1/2' : 'w-full'} flex flex-col`}>
          {/* Modal Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="flex items-center space-x-3">
              {/* Show different header based on whether post has media */}
              {((post.attachments && post.attachments.length > 0) || (post.images && post.images.length > 0)) ? (
                <>
                  <img
                    src={post.author.avatar}
                    alt={post.author.name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = defaultPicture;
                    }}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{post.author.name}</h3>
                    <div className="flex items-center space-x-2">
                      <p className="text-sm text-gray-500">{post.author.timeAgo}</p>
                      {post.isEdited && (
                        <span className="text-xs text-gray-400">
                          • đã chỉnh sửa {post.editedAt}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 text-center">
                  <h3 className="font-semibold text-gray-900 text-lg">Bài viết của {post.author.name}</h3>
                </div>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Author info for posts without images */}
          {(!post.images || post.images.length === 0) && (
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <img
                  src={post.author.avatar}
                  alt={post.author.name}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = defaultPicture;
                  }}
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{post.author.name}</h4>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-500">{post.author.timeAgo}</p>
                    {post.isEdited && (
                      <span className="text-xs text-gray-400">
                        • đã chỉnh sửa {post.editedAt}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Post Content */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                {isEditingPost ? (
                  <div>
                    <textarea
                      value={editContent}
                      onChange={(e) => setEditContent(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="Chỉnh sửa nội dung bài viết..."
                    />
                    <div className="flex justify-end space-x-2 mt-3">
                      <button
                        onClick={handleCancelEdit}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors flex items-center space-x-1"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Hủy</span>
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        disabled={!editContent.trim()}
                        className="px-4 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-1"
                      >
                        <Save className="w-4 h-4" />
                        <span>Lưu</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
                )}
              </div>
              {canEditPost && !isEditingPost && (
                <button
                  onClick={handleStartEdit}
                  className="ml-3 text-gray-400 hover:text-gray-600 p-1"
                  title="Chỉnh sửa bài viết"
                >
                  <Edit className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          

          {/* Post Stats */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                <ThumbsUp className="w-4 h-4 text-blue-600" />
                <span>{post.likes} lượt thích</span>
              </div>
              <div>
                {post.comments.length > 0 && (
                  <span>{post.comments.length} bình luận</span>
                )}
              </div>
            </div>
          </div>

          {/* Post Actions */}
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-around">
              <button
                onClick={() => onLikePost(post.id, 'post')}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
                  post.isLiked ? 'text-blue-600' : 'text-gray-600'
                }`}
              >
                <ThumbsUp className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                <span className="font-medium">Thích</span>
              </button>
              <button 
                onClick={() => setShowComments(!showComments)}
                className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
              >
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">Bình luận ({post.comments.length})</span>
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="flex-1 overflow-y-auto">
            {loadingComments ? (
              <div className="p-4 flex items-center justify-center">
                <div className="flex items-center space-x-2 text-gray-500">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  <span>Đang tải bình luận...</span>
                </div>
              </div>
            ) : (
              <>
                {showComments && post.comments.length > 0 && (
                  <div className="p-4 space-y-4">
                    {post.comments.map((comment) => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        postId={post.id}
                      />
                    ))}
                  </div>
                )}
                {showComments && post.comments.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
                  </div>
                )}
              </>
            )}
          </div>

          {/* Comment Input */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center space-x-3">
              <img
                src={defaultPicture}
                alt="Your avatar"
                className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = defaultPicture;
                }}
              />
              <div className="flex-1 flex flex-col space-y-2">
                <div className="flex items-center space-x-2 relative">
                  <input
                    id={`comment-input-${post.id}`}
                    type="text"
                    value={commentInputs[post.id] || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                      setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))
                    }
                    placeholder="Viết bình luận..."
                    className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent"
                    onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === 'Enter') {
                        onCommentSubmit(post.id);
                      }
                    }}
                  />
                  <button
                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
                    title="Chọn emoji"
                  >
                    <Smile className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onCommentSubmit(post.id)}
                    disabled={!commentInputs[post.id]?.trim()}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>

                  {/* Emoji Picker Popup */}
                  {showEmojiPicker && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-xl p-3 z-50 w-80 max-h-64 overflow-y-auto">
                      <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-900">Chọn emoji</h4>
                        <button
                          onClick={() => setShowEmojiPicker(false)}
                          className="text-gray-400 hover:text-gray-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <div className="grid grid-cols-8 gap-1">
                        {commonEmojis.map((emoji, index) => (
                          <button
                            key={index}
                            onClick={() => handleEmojiSelect(emoji)}
                            className="text-2xl hover:bg-gray-100 rounded p-1 transition-colors hover:scale-110 transform duration-150"
                            title={emoji}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;
