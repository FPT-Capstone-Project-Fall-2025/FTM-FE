import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  MoreHorizontal,
  ThumbsUp,
  MessageCircle,
  Camera,
  Save,
  X,
  XCircle,
  Globe,
  Lock,
  Flag,
  Send,
  User,
  Edit,
  Trash2,
  Smile,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import defaultPicture from '@/assets/dashboard/default-avatar.png';
import type { Post, ReactionType, Comment } from '../../../types/post';

// Video component with thumbnail generation
const VideoWithThumbnail: React.FC<{
  src: string;
  className?: string;
  onClick?: () => void;
  controls?: boolean;
  preload?: string;
  playsInline?: boolean;
}> = ({ src, className, onClick, controls = true, preload = "metadata", playsInline = true }) => {
  const [poster, setPoster] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const generatePoster = () => {
      // Wait for metadata to load
      if (video.readyState >= 2) {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        
        if (ctx && video.videoWidth > 0) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const posterUrl = canvas.toDataURL('image/jpeg', 0.7);
          setPoster(posterUrl);
        }
      }
    };

    video.addEventListener('loadeddata', generatePoster);
    
    // Also try to generate immediately if already loaded
    if (video.readyState >= 2) {
      generatePoster();
    }

    return () => {
      video.removeEventListener('loadeddata', generatePoster);
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      controls={controls}
      preload={preload}
      playsInline={playsInline}
      className={className}
      onClick={onClick}
    >
      Your browser does not support the video tag.
    </video>
  );
};


interface PostCardProps {
  post: Post;
  currentUserGPMemberId?: string;
  userData: { name: string; picture: string };
  reactionTypes: ReactionType[];
  isInModal?: boolean; // NEW: Flag to indicate if rendered in modal

  // Edit mode state
  editingPostId: string | null;
  editContent: string;
  editTitle: string;
  editStatus: number;
  editImages: File[];
  editImagePreviews: string[];
  editCaptions: string[];
  existingImages: { id: string, url: string, caption?: string }[];
  isUpdatingPost: boolean;

  // Edit mode setters
  setEditContent: (content: string) => void;
  setEditTitle: (title: string) => void;
  setEditStatus: (status: React.SetStateAction<number>) => void;

  // Menu states
  showPostMenu: string | null;
  setShowPostMenu: (id: string | null) => void;
  showReactionPicker: string | null;
  setShowReactionPicker: (id: string | null) => void;
  hoveredPost: string | null;
  setHoveredPost: (id: string | null) => void;

  // Reaction tooltip tracking refs
  tooltipShowTime: React.MutableRefObject<{ [postId: string]: number }>;
  isHoveringReactionPicker: React.MutableRefObject<{ [postId: string]: boolean }>;

  // Handlers
  onEditPost: (postId: string, content: string, title?: string) => void;
  onDeletePost: (postId: string) => void;
  onReportPost: (postId: string) => void;
  onSaveEdit: (postId: string) => void;
  onCancelEdit: () => void;
  onReaction: (postId: string, reactionType: string) => void;
  onReactionSummaryClick: (postId: string) => void;
  onOpenPostDetail: (post: Post) => void;

  // Edit image handlers
  onEditImageSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveEditImage: (index: number) => void;
  onRemoveExistingImage: (imageId: string) => void;
  onUpdateEditCaption: (index: number, caption: string) => void;

  // Helper functions
  getReactionSummaryText: (post: Post) => string;
  isCurrentUserPost: (gpMemberId: string) => boolean;

  // Comment features (optional - for inline comments)
  showComments?: boolean;
  commentInputs?: { [key: string]: string };
  setCommentInputs?: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  onCommentSubmit?: (postId: string) => void;
  onLikeComment?: (commentId: string, postId: string) => void;
  onEditComment?: (postId: string, commentId: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
  onReportComment?: (commentId: string) => void;
  onReplySubmit?: (postId: string, commentId: string) => void;
  CommentItem?: React.FC<{
    comment: Comment;
    postId: string;
    depth?: number;
    maxDepth?: number;
  }>;

  // Comment states (optional)
  showCommentMenu?: string | null;
  setShowCommentMenu?: (id: string | null) => void;
  editingCommentId?: string | null;
  setEditingCommentId?: (id: string | null) => void;
  editCommentContent?: string;
  setEditCommentContent?: (content: string) => void;
  replyingToComment?: string | null;
  setReplyingToComment?: (id: string | null) => void;
  replyInputs?: { [key: string]: string };
  setReplyInputs?: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  collapsedReplies?: { [key: string]: boolean };
  setCollapsedReplies?: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
}

// Common emojis list for emoji picker
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

// Recursive Comment Component - Memoized to prevent unnecessary re-renders
// This component is now defined inside the PostCard so it has access to props
export const CommentItem: React.FC<{
  comment: Comment;
  postId: string;
  depth?: number;
  maxDepth?: number;
  // Props needed for functionality
  currentUserGPMemberId?: string;
  userData: { name: string; picture: string };
  editingCommentId?: string | null;
  editCommentContent?: string;
  setEditingCommentId?: (id: string | null) => void;
  setEditCommentContent?: (content: string) => void;
  onEditComment?: (postId: string, commentId: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => void;
  onReportComment?: (commentId: string) => void;
  onLikeComment?: (commentId: string, postId: string) => void;
  replyingToComment?: string | null;
  setReplyingToComment?: (id: string | null) => void;
  replyInputs?: { [key: string]: string };
  setReplyInputs?: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  onReplySubmit?: (postId: string, commentId: string) => void;
  collapsedReplies?: { [key: string]: boolean };
  setCollapsedReplies?: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
  showCommentMenu?: string | null;
  setShowCommentMenu?: (id: string | null) => void;
}> = React.memo(({ 
  comment, 
  postId, 
  depth = 0, 
  maxDepth = 2,
  currentUserGPMemberId,
  userData,
  editingCommentId,
  editCommentContent,
  setEditingCommentId,
  setEditCommentContent,
  onEditComment,
  onDeleteComment,
  onReportComment,
  onLikeComment,
  replyingToComment,
  setReplyingToComment,
  replyInputs,
  setReplyInputs,
  onReplySubmit,
  collapsedReplies,
  setCollapsedReplies,
  showCommentMenu,
  setShowCommentMenu
}) => {
  const canReply = depth < maxDepth;

  return (
    <div className={`${depth > 0 ? 'ml-6 md:ml-10 relative' : ''}`}>
      {/* Thread line for nested comments */}
      {depth > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200"></div>
      )}

      <div className="flex items-start space-x-3">
        <img
          src={
            comment.gpMemberId && comment.gpMemberId === currentUserGPMemberId
              ? (userData.picture || comment.author?.avatar || defaultPicture)
              : (comment.author?.avatar || defaultPicture)
          }
          alt={comment.author?.name || 'User'}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0 relative z-10 bg-white"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultPicture;
          }}
        />
        <div className="flex-1">
          {editingCommentId === comment.id ? (
            // Edit mode
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <p className="font-semibold text-sm text-gray-900 mb-2">{comment.author?.name || 'User'}</p>
              <textarea
                value={editCommentContent}
                onChange={(e) => setEditCommentContent?.(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                rows={3}
                autoFocus
              />
              <div className="flex items-center space-x-2 mt-2">
                <button
                  onClick={() => onEditComment?.(postId, comment.id)}
                  className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                >
                  Lưu
                </button>
                <button
                  onClick={() => {
                    setEditingCommentId?.(null);
                    setEditCommentContent?.('');
                  }}
                  className="px-3 py-1 bg-gray-300 text-gray-700 text-xs rounded-md hover:bg-gray-400"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : (
            // View mode
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <p className="font-semibold text-sm text-gray-900">{comment.author?.name || 'User'}</p>
              <p className="text-gray-900">{comment.content}</p>
              {comment.isEdited && comment.editedAt && (
                <p className="text-xs text-gray-500 italic mt-1">Đã chỉnh sửa {comment.editedAt}</p>
              )}

              {/* Comment Images */}
              {comment.images && comment.images.length > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {comment.images.map((image, imageIndex) => (
                    <img
                      key={imageIndex}
                      src={image}
                      alt={`Comment image ${imageIndex + 1}`}
                      className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => window.open(image, '_blank')}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between mt-1">
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <button
                onClick={() => onLikeComment?.(comment.id, postId)}
                className={`hover:underline ${comment.isLiked ? 'text-blue-600 font-semibold' : ''}`}
              >
                Thích
              </button>
              {canReply && (
                <button
                  onClick={() => setReplyingToComment?.(replyingToComment === comment.id ? null : comment.id)}
                  className="hover:underline"
                >
                  Trả lời
                </button>
              )}
              <span>{comment.timeAgo}</span>
              {comment.likes > 0 && (
                <span className="flex items-center space-x-1">
                  <ThumbsUp className="w-3 h-3 text-blue-600" />
                  <span>{comment.likes}</span>
                </span>
              )}
              {comment.replies && comment.replies.length > 0 && (
                <button
                  onClick={() => setCollapsedReplies?.(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))}
                  className="text-blue-600 font-medium hover:underline"
                >
                  {collapsedReplies?.[comment.id] ? '▶' : '▼'} {comment.replies.length} phản hồi
                </button>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => setShowCommentMenu?.(showCommentMenu === comment.id ? null : comment.id)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <MoreHorizontal className="w-3 h-3" />
              </button>
              {showCommentMenu === comment.id && (
                <div className="absolute right-0 top-6 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                  {comment.gpMemberId && comment.gpMemberId === currentUserGPMemberId ? (
                    // Own comment - show Edit and Delete
                    <>
                      <button
                        onClick={() => {
                          setEditingCommentId?.(comment.id);
                          setEditCommentContent?.(comment.content);
                          setShowCommentMenu?.(null);
                        }}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-xs"
                      >
                        <span>Chỉnh sửa</span>
                      </button>
                      <button
                        onClick={() => onDeleteComment?.(postId, comment.id)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-red-600 text-xs"
                      >
                        <span>Xóa</span>
                      </button>
                    </>
                  ) : (
                    // Other user's comment - show Report only
                    <button
                      onClick={() => onReportComment?.(comment.id)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-red-600 text-xs"
                    >
                      <Flag className="w-3 h-3" />
                      <span>Báo cáo</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Reply Input */}
          {replyingToComment === comment.id && canReply && (
            <div className="mt-3" key={`reply-input-${comment.id}`}>
              <div className="flex items-center space-x-2">
                {userData.picture ? (
                  <img
                    src={userData.picture}
                    alt="Your avatar"
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = defaultPicture;
                    }}
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                    <User size={12} className="text-gray-500" />
                  </div>
                )}
                <input
                  key={`reply-${comment.id}`}
                  type="text"
                  value={replyInputs?.[comment.id] || ''}
                  onChange={(e) => setReplyInputs?.(prev => ({ ...prev, [comment.id]: e.target.value }))}
                  placeholder="Viết trả lời..."
                  className="flex-1 px-3 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      onReplySubmit?.(postId, comment.id);
                    }
                  }}
                  autoFocus
                />
                <button
                  onClick={() => onReplySubmit?.(postId, comment.id)}
                  disabled={!replyInputs?.[comment.id]?.trim()}
                  className="p-1 text-blue-600 hover:bg-blue-50 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nested Replies */}
      {comment.replies && comment.replies.length > 0 && !collapsedReplies?.[comment.id] && (
        <div className={`mt-3 space-y-3 ${depth > 0 ? 'pl-3' : ''}`}>
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              depth={depth + 1}
              maxDepth={maxDepth}
              {...(currentUserGPMemberId && { currentUserGPMemberId })}
              userData={userData}
              {...(editingCommentId !== undefined && { editingCommentId })}
              {...(editCommentContent !== undefined && { editCommentContent })}
              {...(setEditingCommentId && { setEditingCommentId })}
              {...(setEditCommentContent && { setEditCommentContent })}
              {...(onEditComment && { onEditComment })}
              {...(onDeleteComment && { onDeleteComment })}
              {...(onReportComment && { onReportComment })}
              {...(onLikeComment && { onLikeComment })}
              {...(replyingToComment !== undefined && { replyingToComment })}
              {...(setReplyingToComment && { setReplyingToComment })}
              {...(replyInputs && { replyInputs })}
              {...(setReplyInputs && { setReplyInputs })}
              {...(onReplySubmit && { onReplySubmit })}
              {...(collapsedReplies && { collapsedReplies })}
              {...(setCollapsedReplies && { setCollapsedReplies })}
              {...(showCommentMenu !== undefined && { showCommentMenu })}
              {...(setShowCommentMenu && { setShowCommentMenu })}
            />
          ))}
        </div>
      )}
    </div>
  );
});


const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUserGPMemberId,
  userData,
  reactionTypes,
  isInModal = false,

  editingPostId,
  editContent,
  editTitle,
  editStatus,
  editImagePreviews,
  editCaptions,
  existingImages,
  isUpdatingPost,

  setEditContent,
  setEditTitle,
  setEditStatus,

  showPostMenu,
  setShowPostMenu,
  showReactionPicker,
  setShowReactionPicker,
  hoveredPost,
  setHoveredPost,

  tooltipShowTime,
  isHoveringReactionPicker,

  onEditPost,
  onDeletePost,
  onReportPost,
  onSaveEdit,
  onCancelEdit,
  onReaction,
  onReactionSummaryClick,
  onOpenPostDetail,

  onEditImageSelect,
  onRemoveEditImage,
  onRemoveExistingImage,
  onUpdateEditCaption,

  getReactionSummaryText,
  isCurrentUserPost,


  // Comment features (optional)
  showComments = false,
  commentInputs = {},
  setCommentInputs,
  onCommentSubmit,
  onLikeComment,
  onEditComment,
  onDeleteComment,
  onReportComment,
  onReplySubmit,
  CommentItem,

  // Comment states (optional)
  showCommentMenu,
  setShowCommentMenu,
  editingCommentId,
  setEditingCommentId,
  editCommentContent,
  setEditCommentContent,
  replyingToComment,
  setReplyingToComment,
  replyInputs,
  setReplyInputs,
  collapsedReplies,
  setCollapsedReplies,
}) => {

  
  const [localShowComments, setLocalShowComments] = useState(showComments);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Toggle comments visibility
  const handleToggleComments = () => {
    // If in modal, do nothing (disabled)
    if (isInModal) {
      return;
    }
    
    if (showComments) {
      setLocalShowComments(!localShowComments);
    } else {
      // If showComments is false, clicking opens the detail modal instead
      onOpenPostDetail(post);
    }
  };

  // Handle emoji insertion for comment
  const handleEmojiSelect = (postId: string, emoji: string) => {
    if (setCommentInputs && commentInputs) {
      setCommentInputs(prev => ({
        ...prev,
        [postId]: (prev[postId] || '') + emoji
      }));
      setShowEmojiPicker(false);
      // Focus back on the input
      const input = document.querySelector(`#comment-input-${postId}`) as HTMLInputElement;
      if (input) input.focus();
    }
  };

  // Check if this post belongs to current user
  const isOwnPost = post.gpMemberId && currentUserGPMemberId && post.gpMemberId === currentUserGPMemberId;

  // Get display name and avatar with proper fallback
  const displayName = post.author.name;
  const displayAvatar = post.author.avatar;

  return (
    <div key={post.id} className="bg-white shadow-sm rounded-lg border border-gray-200">
      {/* Post Header */}
      <div className="p-6 pb-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={displayAvatar}
              alt={displayName}
              className="w-12 h-12 rounded-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultPicture;
              }}
            />
            <div>
              <h3 className="font-semibold text-gray-900">
                {displayName}
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => onOpenPostDetail(post)}
                  className="text-sm text-gray-500 hover:text-gray-700 hover:underline cursor-pointer"
                >
                  {post.author.timeAgo}
                </button>
                {post.isEdited && (
                  <span className="text-xs text-gray-400">
                    • đã chỉnh sửa {post.editedAt}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="relative">
            {/* Show Edit button for own posts, More menu for others */}
            {isCurrentUserPost(post.gpMemberId) ? (
              <button
                onClick={() => setShowPostMenu(showPostMenu === post.id ? null : post.id)}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                title="Tùy chọn bài viết"
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => setShowPostMenu(showPostMenu === post.id ? null : post.id)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>

                {/* Dropdown Menu - Only for other users' posts */}
                {showPostMenu === post.id && (
                  <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                    <button
                      onClick={() => onReportPost(post.id)}
                      className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-red-600"
                    >
                      <Flag className="w-4 h-4" />
                      <span>Báo cáo bài viết</span>
                    </button>
                  </div>
                )}
              </>
            )}

            {/* Own post menu */}
            {isCurrentUserPost(post.gpMemberId) && showPostMenu === post.id && (
              <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                <button
                  onClick={() => {
                    onEditPost(post.id, post.content, post.title);
                    setShowPostMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Chỉnh sửa</span>
                </button>
                <button
                  onClick={() => {
                    onDeletePost(post.id);
                    setShowPostMenu(null);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-red-600"
                >
                  <X className="w-4 h-4" />
                  <span>Xóa bài viết</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Post Title */}
      {post.title && (
        <div className="px-6 pb-2">
          <h3 className="text-lg font-semibold text-gray-900">{post.title}</h3>
        </div>
      )}

      {/* Post Content */}
      <div className="px-6 pb-4">
        {editingPostId === post.id ? (
          <div className="space-y-4">
            {/* Edit Header with Privacy */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <h4 className="font-semibold text-gray-900">Chỉnh sửa bài viết</h4>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setEditStatus(prev => prev === 1 ? 0 : 1)}
                  className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  {editStatus === 1 ? (
                    <>
                      <Globe className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-gray-700">Công khai</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-4 h-4 text-gray-600" />
                      <span className="text-sm text-gray-700">Chỉ mình tôi</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Title Input */}
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Tiêu đề bài viết (tùy chọn)"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            {/* Content Input */}
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Bạn đang nghĩ gì?"
              className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
            />

            {/* Existing Images */}
            {existingImages.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Ảnh hiện tại:</h5>
                <div className="grid grid-cols-2 gap-2">
                  {existingImages.map((image, index) => (
                    <div key={image.id} className="relative">
                      <img
                        src={image.url}
                        alt={`Existing ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => onRemoveExistingImage(image.id)}
                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* New Images */}
            {editImagePreviews.length > 0 && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">Ảnh mới:</h5>
                <div className="grid grid-cols-2 gap-2">
                  {editImagePreviews.map((preview, index) => (
                    <div key={index} className="space-y-2">
                      <div className="relative">
                        <img
                          src={preview}
                          alt={`New ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                        <button
                          onClick={() => onRemoveEditImage(index)}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <input
                        type="text"
                        value={editCaptions[index] || ''}
                        onChange={(e) => onUpdateEditCaption(index, e.target.value)}
                        placeholder={`Mô tả cho ảnh ${index + 1}...`}
                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Media Button */}
            <div className="flex items-center space-x-2">
              <input
                type="file"
                id={`edit-image-${post.id}`}
                multiple
                accept="image/*,video/*"
                onChange={onEditImageSelect}
                className="hidden"
              />
              <label
                htmlFor={`edit-image-${post.id}`}
                className="flex items-center space-x-2 px-4 py-2 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg cursor-pointer transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span className="text-sm font-medium">Thêm ảnh/video</span>
              </label>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
              <button
                onClick={onCancelEdit}
                disabled={isUpdatingPost}
                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                onClick={() => onSaveEdit(post.id)}
                disabled={isUpdatingPost}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
              >
                {isUpdatingPost ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu thay đổi</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ) : (
          <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
        )}
      </div>

      {/* Post Media (Images/Videos) */}
      {((post.attachments && post.attachments.length > 0) || (post.images && post.images.length > 0)) && (() => {
        const mediaList = post.attachments || (post.images?.map((url, idx) => ({
          id: `img-${idx}`,
          fileUrl: url,
          fileType: 0,
          caption: undefined
        })) || []);
        const mediaCount = mediaList.length;
        const isSingleMedia = mediaCount === 1;

        if (mediaCount === 0) return null;

        return (
          <div className="px-6 pb-4 cursor-pointer"  onClick={() => onOpenPostDetail(post)}>
            {isSingleMedia ? (
              // Single media - Display with 1:1 aspect ratio (square)
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-black">
                {mediaList[0]!.fileType === 1 ? (
                  // Single Video
                  <VideoWithThumbnail
                    src={mediaList[0]!.fileUrl}
                    className="w-full h-full object-contain cursor-pointer"
                    onClick={() => onOpenPostDetail(post)}
                  />
                ) : (
                  // Single Image
                  <img
                    src={mediaList[0]!.fileUrl}
                    alt={mediaList[0]!.caption || "Post media"}
                    className="w-full h-full object-contain cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => onOpenPostDetail(post)}
                  />
                )}
                {/* Show caption if available */}
                {mediaList[0]!.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-sm p-2">
                    {mediaList[0]!.caption}
                  </div>
                )}
              </div>
            ) : (
              // Multiple media - Carousel with prev/next buttons
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-black">
                {/* Current Media Display */}
                <div className="w-full h-full">
                  {mediaList[currentMediaIndex]!.fileType === 1 ? (
                    // Video
                    <VideoWithThumbnail
                      key={mediaList[currentMediaIndex]!.id}
                      src={mediaList[currentMediaIndex]!.fileUrl}
                      className="w-full h-full object-contain"
                    />
                  ) : (
                    // Image
                    <img
                      key={mediaList[currentMediaIndex]!.id}
                      src={mediaList[currentMediaIndex]!.fileUrl}
                      alt={mediaList[currentMediaIndex]!.caption || `Media ${currentMediaIndex + 1}`}
                      className="w-full h-full object-contain"
                    />
                  )}
                  {/* Show caption if available */}
                  {mediaList[currentMediaIndex]!.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-sm p-2">
                      {mediaList[currentMediaIndex]!.caption}
                    </div>
                  )}
                </div>

                {/* Previous Button */}
                {currentMediaIndex > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentMediaIndex(prev => prev - 1);
                    }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full flex items-center justify-center shadow-lg transition-all z-10"
                    aria-label="Previous media"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-800" />
                  </button>
                )}

                {/* Next Button */}
                {currentMediaIndex < mediaCount - 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentMediaIndex(prev => prev + 1);
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full flex items-center justify-center shadow-lg transition-all z-10"
                    aria-label="Next media"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-800" />
                  </button>
                )}

                {/* Media Counter */}
                <div className="absolute top-4 right-4 bg-black bg-opacity-60 text-white text-xs px-3 py-1 rounded-full">
                  {currentMediaIndex + 1} / {mediaCount}
                </div>

                {/* Dots Indicator */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center space-x-2">
                  {mediaList.map((_, index) => (
                    <button
                      key={index}
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentMediaIndex(index);
                      }}
                      className={`w-2 h-2 rounded-full transition-all ${
                        index === currentMediaIndex 
                          ? 'bg-white w-6' 
                          : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                      }`}
                      aria-label={`Go to media ${index + 1}`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {/* Post Stats */}
      <div className="px-6 py-3 border-t border-gray-200">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            {post.totalReactions > 0 ? (
              <div
                className="flex items-center space-x-1 cursor-pointer hover:underline relative"
                onMouseEnter={() => {
                  setHoveredPost(post.id);
                  tooltipShowTime.current[post.id] = Date.now();
                }}
                onMouseLeave={() => {
                  // Don't close if hovering over reaction picker
                  if (isHoveringReactionPicker.current[post.id]) {
                    return;
                  }

                  const showTime = tooltipShowTime.current[post.id];
                  if (!showTime) {
                    setHoveredPost(null);
                    return;
                  }

                  const elapsed = Date.now() - showTime;
                  const minDisplayTime = 2000; // 2 seconds minimum
                  const remainingTime = Math.max(0, minDisplayTime - elapsed);

                  setTimeout(() => {
                    // Double check not hovering reaction picker
                    if (!isHoveringReactionPicker.current[post.id]) {
                      setHoveredPost(null);
                      delete tooltipShowTime.current[post.id];
                    }
                  }, remainingTime);
                }}
              >
                <div onClick={() => onReactionSummaryClick(post.id)}>
                  <span className="text-lg">{getReactionSummaryText(post)}</span>
                  <span className="ml-1">{post.totalReactions}</span>
                </div>

                {/* Reaction tooltip dropdown - clickable */}
                {hoveredPost === post.id && (
                  <div
                    className="absolute left-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-3 min-w-[200px] z-[9999]"
                    style={{ pointerEvents: 'auto' }}
                    onMouseEnter={() => {
                      setHoveredPost(post.id);
                      if (!tooltipShowTime.current[post.id]) {
                        tooltipShowTime.current[post.id] = Date.now();
                      }
                    }}
                    onMouseLeave={() => {
                      // Don't close if hovering over reaction picker
                      if (isHoveringReactionPicker.current[post.id]) {
                        return;
                      }

                      const showTime = tooltipShowTime.current[post.id];
                      if (!showTime) {
                        setHoveredPost(null);
                        return;
                      }

                      const elapsed = Date.now() - showTime;
                      const minDisplayTime = 2000; // 2 seconds minimum
                      const remainingTime = Math.max(0, minDisplayTime - elapsed);

                      setTimeout(() => {
                        // Double check not hovering reaction picker
                        if (!isHoveringReactionPicker.current[post.id]) {
                          setHoveredPost(null);
                          delete tooltipShowTime.current[post.id];
                        }
                      }, remainingTime);
                    }}
                  >
                    <div className="space-y-1 text-sm">
                      {Object.entries(post.reactionsSummary)
                        .sort((a, b) => b[1] - a[1])
                        .map(([type, count]) => {
                          const reactionEmoji = reactionTypes.find(r => r.type.toLowerCase() === type.toLowerCase())?.emoji || '👍';
                          const reactionLabel = reactionTypes.find(r => r.type.toLowerCase() === type.toLowerCase())?.label || type;
                          return (
                            <button
                              key={type}
                              onClick={(e) => {
                                e.stopPropagation();
                                onReactionSummaryClick(post.id);
                              }}
                              className="w-full flex items-center justify-between hover:bg-gray-50 px-3 py-2 rounded transition-colors cursor-pointer"
                            >
                              <span className="flex items-center space-x-2">
                                <span className="text-lg">{reactionEmoji}</span>
                                <span className="text-gray-700">{reactionLabel}</span>
                              </span>
                              <span className="font-semibold text-blue-600">{count}</span>
                            </button>
                          );
                        })}
                    </div>
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onReactionSummaryClick(post.id);
                        }}
                        className="w-full text-center text-xs text-blue-600 hover:text-blue-700 font-medium py-1"
                      >
                        Xem tất cả →
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <span>0 phản ứng</span>
            )}
          </div>
          <div>
            {(post.totalComments ?? post.comments.length) > 0 && (
              <span>{post.totalComments ?? post.comments.length} bình luận</span>
            )}
          </div>
        </div>
      </div>

      {/* Post Actions */}
      <div className="px-6 py-3 border-t border-gray-200">
        <div className="flex items-center justify-around">
          <div className="relative">
            <button
              onMouseEnter={() => {
                setShowReactionPicker(post.id);
                isHoveringReactionPicker.current[post.id] = true;
              }}
              onMouseLeave={() => {
                // Delay hiding to allow hovering over picker (like Facebook)
                setTimeout(() => {
                  if (showReactionPicker === post.id && !isHoveringReactionPicker.current[post.id]) {
                    setShowReactionPicker(null);
                  }
                }, 500);
              }}
              onClick={() => {
                // Quick click: if user already has a reaction, toggle it off
                // If no reaction, add Like by default
                if (!showReactionPicker) {
                  const reactionToToggle = post.userReaction || 'Like';
                  onReaction(post.id, reactionToToggle);
                }
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors relative ${post.userReaction ? 'text-blue-600' : 'text-gray-600'
                }`}
            >
              {post.userReaction ? (
                <span className="text-lg">
                  {reactionTypes.find(r => r.type === post.userReaction)?.emoji || '👍'}
                </span>
              ) : (
                <ThumbsUp className="w-5 h-5" />
              )}
              <span className={`${post.userReaction ? 'font-bold' : 'font-medium'}`}>
                {post.userReaction ? reactionTypes.find(r => r.type === post.userReaction)?.label : 'Thích'}
              </span>
            </button>

            {/* Reaction Picker */}
            {showReactionPicker === post.id && (
              <div
                className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-full shadow-lg p-2 flex space-x-2 z-50"
                onMouseEnter={() => {
                  setShowReactionPicker(post.id);
                  isHoveringReactionPicker.current[post.id] = true;
                }}
                onMouseLeave={() => {
                  // Delay closing to allow smooth transition
                  setTimeout(() => {
                    setShowReactionPicker(null);
                    isHoveringReactionPicker.current[post.id] = false;
                  }, 300);
                }}
                onClick={(e) => e.stopPropagation()}
              >
                {reactionTypes.map((reaction) => (
                  <button
                    key={reaction.type}
                    onMouseEnter={(e) => {
                      // Hover to select reaction (like Facebook)
                      e.stopPropagation();
                      console.log('🎯 Hovered reaction:', reaction.type, 'ID:', reaction.id, 'Emoji:', reaction.emoji);
                      onReaction(post.id, reaction.type);
                      // Close picker after selection with delay
                      setTimeout(() => {
                        setShowReactionPicker(null);
                        isHoveringReactionPicker.current[post.id] = false;
                      }, 200);
                    }}
                    onClick={(e) => {
                      // Also allow click for mobile/accessibility
                      e.stopPropagation();
                      e.preventDefault();
                      console.log('🎯 Clicked reaction:', reaction.type, 'ID:', reaction.id, 'Emoji:', reaction.emoji);
                      onReaction(post.id, reaction.type);
                      // Close picker immediately on click
                      setShowReactionPicker(null);
                      isHoveringReactionPicker.current[post.id] = false;
                    }}
                    className="text-2xl hover:scale-125 transition-transform duration-200 p-1 rounded-full hover:bg-gray-100"
                    title={reaction.label}
                  >
                    {reaction.emoji}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={handleToggleComments}
            disabled={isInModal}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
              isInModal 
                ? 'cursor-not-allowed opacity-50 text-gray-400' 
                : 'hover:bg-gray-100 text-gray-600 cursor-pointer'
            }`}
          >
            <MessageCircle className="w-5 h-5" />
            <span className="font-medium">Bình luận ({post.totalComments ?? post.comments.length})</span>
          </button>
        </div>
      </div>

    </div>
  );
};

export default PostCard;
