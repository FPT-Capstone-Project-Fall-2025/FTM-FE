import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import {
  MoreHorizontal,
  ThumbsUp,
  Camera,
  Save,
  X,
  XCircle,
  Globe,
  Lock,
  Flag,
  Send,
  User,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import defaultPicture from '@/assets/dashboard/default-avatar.png';
import type { Post, ReactionType, Comment } from '../../../types/post';
import PostStats from './PostStats';
import familyTreeMemberService, { getAvatarFromGPMember, getDisplayNameFromGPMember } from '@/services/familyTreeMemberService';
import PostActions from './PostActions';

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

// Helper function to check if URL is a video
const isVideoUrl = (url: string): boolean => {
  if (!url) return false;
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.m4v', '.3gp', '.flv', '.wmv'];
  const urlLower = url.toLowerCase();
  return videoExtensions.some(ext => urlLower.includes(ext));
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
  existingImages: { id: string, url: string, caption?: string, fileType?: number }[];
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
  maxDepth = 1, // Only allow 2 levels: comments (depth 0) and replies (depth 1)
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
  const { id: familyTreeId } = useParams<{ id: string }>();
  const [commentDisplayName, setCommentDisplayName] = useState<string>(comment.author?.name || 'User');
  const [commentGpAvatar, setCommentGpAvatar] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!comment.gpMemberId || !familyTreeId) return;
      const profile = await familyTreeMemberService.getGPMemberByMemberId(familyTreeId, comment.gpMemberId);
      if (cancelled || !profile) return;
      const name = getDisplayNameFromGPMember(profile) || comment.author?.name || 'User';
      const avatar = getAvatarFromGPMember(profile) || null;
      setCommentDisplayName(name);
      setCommentGpAvatar(avatar);
    })();
    return () => { cancelled = true; };
  }, [comment.gpMemberId, familyTreeId]);
  const canReply = depth < maxDepth; // depth 0 (comment) can reply, depth 1 (reply) cannot

  // Calculate avatar source with priority (Group → current user fallback → api → default)
  const commentAvatar = commentGpAvatar || (comment.gpMemberId === currentUserGPMemberId ? userData.picture : null) || comment.author?.avatar || defaultPicture;
  
  // Debug: Log comment avatar source
  React.useEffect(() => {
    console.log('💬 [CommentItem] Rendering comment:', {
      commentId: comment.id,
      authorName: comment.author?.name,
      avatar: commentAvatar,
      isCurrentUser: comment.gpMemberId === currentUserGPMemberId,
      avatarSource: commentAvatar?.includes('/ftmembers/') ? 'GPMember (ftMemberFiles)' : 
                    commentAvatar?.includes('/avatars/') ? 'Global Profile' : 
                    commentAvatar?.includes('ui-avatars.com') ? 'UI Avatars' :
                    'defaultPicture'
    });
  }, [comment.id, comment.author?.name, commentAvatar, comment.gpMemberId, currentUserGPMemberId]);

  return (
    <div className={`${depth > 0 ? 'ml-6 md:ml-10 relative' : ''}`}>
      {/* Thread line for nested comments */}
      {depth > 0 && (
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-gray-200"></div>
      )}

      <div className="flex items-start space-x-3">
        <img
          src={commentAvatar}
          alt={commentDisplayName}
          className="w-8 h-8 rounded-full object-cover flex-shrink-0 relative z-10 bg-white"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultPicture;
          }}
        />
        <div className="flex-1">
          {editingCommentId === comment.id ? (
            // Edit mode
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <p className="font-semibold text-sm text-gray-900 mb-2">{commentDisplayName}</p>
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
              <p className="font-semibold text-sm text-gray-900">{commentDisplayName}</p>
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
  currentUserGPMemberId: _currentUserGPMemberId,
  userData: _userData,
  reactionTypes,
  isInModal = false,

  editingPostId,
  editContent,
  editTitle,
  editStatus,
  editImages,
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


  // Comment features (optional - unused in this simplified PostCard)
  showComments = false,
  commentInputs: _commentInputs = {},
  setCommentInputs: _setCommentInputs,
  onCommentSubmit: _onCommentSubmit,
  onLikeComment: _onLikeComment,
  onEditComment: _onEditComment,
  onDeleteComment: _onDeleteComment,
  onReportComment: _onReportComment,
  onReplySubmit: _onReplySubmit,
  CommentItem: _CommentItem,

  // Comment states (optional - unused)
  showCommentMenu: _showCommentMenu,
  setShowCommentMenu: _setShowCommentMenu,
  editingCommentId: _editingCommentId,
  setEditingCommentId: _setEditingCommentId,
  editCommentContent: _editCommentContent,
  setEditCommentContent: _setEditCommentContent,
  replyingToComment: _replyingToComment,
  setReplyingToComment: _setReplyingToComment,
  replyInputs: _replyInputs,
  setReplyInputs: _setReplyInputs,
  collapsedReplies: _collapsedReplies,
  setCollapsedReplies: _setCollapsedReplies,
}) => {

  
  const [localShowComments, setLocalShowComments] = useState(showComments);
  const [_showEmojiPicker, _setShowEmojiPicker] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [resolvedTypes, setResolvedTypes] = useState<Record<string, 'video' | 'image'>>({});

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

  // Group-specific author mapping using gpMemberId
  const { id: familyTreeId } = useParams<{ id: string }>();
  const [displayName, setDisplayName] = useState<string>(post.author.name);
  const [displayAvatar, setDisplayAvatar] = useState<string>(post.author.avatar || defaultPicture);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!post.gpMemberId || !familyTreeId) return;
      const profile = await familyTreeMemberService.getGPMemberByMemberId(familyTreeId, post.gpMemberId);
      if (cancelled || !profile) return;
      const name = getDisplayNameFromGPMember(profile) || post.author.name;
      const avatar = getAvatarFromGPMember(profile) || post.author.avatar || defaultPicture;
      setDisplayName(name);
      setDisplayAvatar(avatar);
    })();
    return () => { cancelled = true; };
  }, [post.gpMemberId, familyTreeId]);

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
                {/* Privacy Status */}
                <span className="text-gray-300">•</span>
                {Number(post.status ?? 1) === 1 ? (
                  <div className="flex items-center space-x-1 text-gray-500" title="Công khai">
                    <Globe className="w-3.5 h-3.5" />
                    <span className="text-xs">Công khai</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-1 text-gray-500" title="Chỉ mình tôi">
                    <Lock className="w-3.5 h-3.5" />
                    <span className="text-xs">Chỉ mình tôi</span>
                  </div>
                )}
                {post.isEdited && (
                  <>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-400">
                      đã chỉnh sửa {post.editedAt}
                    </span>
                  </>
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

      {/* Post Title - Only show when not editing */}
      {post.title && editingPostId !== post.id && (
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

            {/* Media (Existing + New) */}
            {(existingImages.length > 0 || editImagePreviews.length > 0) && (
              <div className="space-y-2">
                <h5 className="text-sm font-medium text-gray-700">
                  Media ({existingImages.length + editImagePreviews.length})
                </h5>
                <div className="grid grid-cols-2 gap-2">
                  {/* Existing Images/Videos */}
                  {existingImages.map((image, index) => {
                    const isVideo = image.fileType === 1 || isVideoUrl(image.url);
                    return (
                      <div key={`existing-${image.id}`} className="space-y-2">
                        <div className="relative">
                          {isVideo ? (
                            <video
                              src={image.url}
                              className="w-full h-32 object-cover rounded-lg"
                              controls
                              preload="metadata"
                              playsInline
                            >
                              Your browser does not support the video tag.
                            </video>
                          ) : (
                            <img
                              src={image.url}
                              alt={`Media ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          )}
                          <button
                            onClick={() => onRemoveExistingImage(image.id)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </div>
                        {image.caption && (
                          <p className="text-xs text-gray-600 px-2">{image.caption}</p>
                        )}
                      </div>
                    );
                  })}
                  
                  {/* New Images/Videos */}
                  {editImagePreviews.map((preview, index) => {
                    const isVideo = editImages[index]?.type.startsWith('video/');
                    const mediaNumber = existingImages.length + index + 1;
                    return (
                      <div key={`new-${index}`} className="space-y-2">
                        <div className="relative">
                          {isVideo ? (
                            <video
                              src={preview}
                              className="w-full h-32 object-cover rounded-lg"
                              controls
                              preload="metadata"
                              playsInline
                            >
                              Your browser does not support the video tag.
                            </video>
                          ) : (
                            <img
                              src={preview}
                              alt={`Media ${mediaNumber}`}
                              className="w-full h-32 object-cover rounded-lg"
                            />
                          )}
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
                          placeholder={`Mô tả cho ${isVideo ? 'video' : 'ảnh'} ${mediaNumber}...`}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    );
                  })}
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
        // Helper function to detect if URL is a video
        const isVideoUrl = (url: string): boolean => {
          const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
          return videoExtensions.some(ext => url.toLowerCase().includes(ext));
        };

        const mediaList = post.attachments || (post.images?.map((url, idx) => ({
          id: `img-${idx}`,
          fileUrl: url,
          fileType: isVideoUrl(url) ? 1 : 0, // 1 for video, 0 for image
          caption: undefined
        })) || []);
        const mediaCount = mediaList.length;
        const isSingleMedia = mediaCount === 1;

        // Resolve uncertain media types (no extension and fileType not reliable)
        useEffect(() => {
          let cancelled = false;
          const run = async () => {
            for (const item of mediaList) {
              const id = item.id;
              const url = item.fileUrl;
              if (resolvedTypes[id]) continue;
              const byUrl = isVideoUrl(url);
              const byType = item.fileType === 1 || (item as any).fileType === 'video';
              if (byUrl || byType) {
                if (cancelled) return;
                setResolvedTypes(prev => ({ ...prev, [id]: 'video' }));
                continue;
              }
              const isImage = await new Promise<boolean>((resolve) => {
                const img = new Image();
                img.onload = () => resolve(true);
                img.onerror = () => resolve(false);
                img.src = url;
              });
              if (cancelled) return;
              if (isImage) {
                setResolvedTypes(prev => ({ ...prev, [id]: 'image' }));
                continue;
              }
              const isVid = await new Promise<boolean>((resolve) => {
                const vid = document.createElement('video');
                const onLoaded = () => { cleanup(); resolve(true); };
                const onError = () => { cleanup(); resolve(false); };
                const cleanup = () => {
                  vid.removeEventListener('loadedmetadata', onLoaded);
                  vid.removeEventListener('error', onError);
                };
                vid.addEventListener('loadedmetadata', onLoaded);
                vid.addEventListener('error', onError);
                vid.preload = 'metadata';
                vid.src = url;
              });
              if (cancelled) return;
              setResolvedTypes(prev => ({ ...prev, [id]: isVid ? 'video' : 'image' }));
            }
          };
          run();
          return () => { cancelled = true; };
        }, [post.id, mediaCount]);

        return (
          <div className="px-6 pb-4 cursor-pointer"  onClick={() => onOpenPostDetail(post)}>
            {isSingleMedia ? (
              // Single media - Display with 1:1 aspect ratio (square)
              <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-black">
                {(() => {
                  const item = mediaList[0]!;
                  const forced = resolvedTypes[item.id];
                  const url = item.fileUrl;
                  const byUrl = isVideoUrl(url);
                  const byType = item.fileType === 1 || (item as any).fileType === 'video';
                  // Default to image unless we are certain it's a video
                  const isVideo = forced ? forced === 'video' : (byUrl || byType);
                  return isVideo;
                })() ? (
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
                  {(() => {
                    const item = mediaList[currentMediaIndex]!;
                    const forced = resolvedTypes[item.id];
                    const url = item.fileUrl;
                    const byUrl = isVideoUrl(url);
                    const byType = item.fileType === 1 || (item as any).fileType === 'video';
                    // Default to image unless we are certain it's a video
                    const isVideo = forced ? forced === 'video' : (byUrl || byType);
                    return isVideo;
                  })() ? (
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
      <PostStats
        post={post}
        reactionTypes={reactionTypes}
        hoveredPost={hoveredPost}
        setHoveredPost={setHoveredPost}
        tooltipShowTime={tooltipShowTime}
        isHoveringReactionPicker={isHoveringReactionPicker}
        getReactionSummaryText={getReactionSummaryText}
        onReactionSummaryClick={onReactionSummaryClick}
      />

      {/* Post Actions */}
      <PostActions
        post={post}
        reactionTypes={reactionTypes}
        showReactionPicker={showReactionPicker}
        setShowReactionPicker={setShowReactionPicker}
        onReaction={onReaction}
        onCommentClick={handleToggleComments}
        isInModal={isInModal}
      />

    </div>
  );
};

export default PostCard;
