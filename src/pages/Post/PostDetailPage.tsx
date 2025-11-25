import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import defaultPicture from '@/assets/dashboard/default-avatar.png';
import { X, Edit, Save, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import postService from '@/services/postService';
import type { Post as PostType, Comment as CommentType, ReactionType } from '@/types/post';
import CommentInput from './components/CommentInput';
import CommentArea from './components/CommentArea';
import PostActions from './components/PostActions';
import PostStats from './components/PostStats';
import familyTreeMemberService, { getAvatarFromGPMember, getDisplayNameFromGPMember } from '@/services/familyTreeMemberService';

// Video component with thumbnail generation
const VideoWithThumbnail: React.FC<{
  src: string;
  className?: string;
  controls?: boolean;
  preload?: string;
  playsInline?: boolean;
}> = ({ src, className, controls = true, preload = "metadata", playsInline = true }) => {
  const [poster, setPoster] = useState<string>('');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const generatePoster = () => {
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
    >
      Your browser does not support the video tag.
    </video>
  );
};

// Helper function to check if URL is a video
const isVideoUrl = (url: string): boolean => {
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv'];
  const urlLower = url.toLowerCase();
  return videoExtensions.some(ext => urlLower.includes(ext));
};

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
  reactionTypes?: ReactionType[];
  showReactionPicker?: string | null;
  setShowReactionPicker?: (id: string | null) => void;
  onReaction?: (postId: string, reactionType: string) => void;
  hoveredPost?: string | null;
  setHoveredPost?: (id: string | null) => void;
  tooltipShowTime?: React.MutableRefObject<{ [postId: string]: number }>;
  isHoveringReactionPicker?: React.MutableRefObject<{ [postId: string]: boolean }>;
  getReactionSummaryText?: (post: PostType) => string;
  onReactionSummaryClick?: (postId: string) => void;
  userData?: { name: string; picture: string };
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
  onCommentSubmit,
  onEditPost,
  onUpdateComments,
  reactionTypes = [],
  onReaction,
  getReactionSummaryText,
  onReactionSummaryClick,
  userData,
  CommentItem
}) => {
  const { id: _groupId } = useParams<{ id: string }>();
  const { user } = useAppSelector(state => state.auth);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editContent, setEditContent] = useState('');
  const [showComments, setShowComments] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [commentRefreshTrigger, setCommentRefreshTrigger] = useState(0);
  
  // ALWAYS use local state for modal to prevent hover sync with main feed
  // Modal should have completely independent hover behavior
  const localTooltipShowTime = useRef<{ [postId: string]: number }>({});
  const localIsHoveringReactionPicker = useRef<{ [postId: string]: boolean }>({});
  const [localHoveredPost, setLocalHoveredPost] = useState<string | null>(null);
  const [localShowReactionPicker, setLocalShowReactionPicker] = useState<string | null>(null);
  
  // Modal uses its own local state for hover/tooltips (independent from main feed)
  const effectiveTooltipShowTime = localTooltipShowTime;
  const effectiveIsHoveringReactionPicker = localIsHoveringReactionPicker;
  const effectiveHoveredPost = localHoveredPost;
  const effectiveSetHoveredPost = setLocalHoveredPost;
  const effectiveShowReactionPicker = localShowReactionPicker;
  const effectiveSetShowReactionPicker = setLocalShowReactionPicker;

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

  /**
   * Extract avatar URL from GPMember ftMemberFiles
   * Looks for file with title containing 'Avatar' (case-sensitive) and isActive = true
   */
  const extractAvatarFromFtMemberFiles = (ftMemberFiles: any[]): string | null => {
    if (!ftMemberFiles || ftMemberFiles.length === 0) return null;
    
    const avatarFile = ftMemberFiles.find(file => 
      file.title && 
      file.title.includes('Avatar') && 
      file.isActive
    );
    
    return avatarFile?.filePath || null;
  };

  // Function to transform API comment to Comment interface
  const transformApiComment = (apiComment: any): CommentType => {
    // Priority 1: Extract avatar from ftMemberFiles (GPMember specific)
    // Priority 2: Use authorPicture (may be global profile)
    // Priority 3: Default picture
    const avatarFromGPMember = extractAvatarFromFtMemberFiles(apiComment.ftMemberFiles);
    const avatar = avatarFromGPMember || apiComment.authorPicture || defaultPicture;
    
    console.log('🔍 [PostDetailPage Comment] Avatar extraction:', {
      commentId: apiComment.id,
      authorName: apiComment.authorName,
      hasFtMemberFiles: !!apiComment.ftMemberFiles,
      ftMemberFilesCount: apiComment.ftMemberFiles?.length || 0,
      avatarFromGPMember,
      authorPicture: apiComment.authorPicture,
      finalAvatar: avatar,
      source: avatarFromGPMember ? 'GPMember (ftMemberFiles)' : 
              apiComment.authorPicture ? 'authorPicture (may be global)' : 
              'defaultPicture'
    });
    
    const comment: CommentType = {
      id: apiComment.id || `comment-${Date.now()}-${Math.random()}`,
      gpMemberId: apiComment.gpMemberId,
      author: {
        name: apiComment.authorName || 'Unknown User',
        avatar: avatar
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

  // Reset modal's local hover state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Clear all hover states when modal closes
      setLocalShowReactionPicker(null);
      setLocalHoveredPost(null);
      localTooltipShowTime.current = {};
      localIsHoveringReactionPicker.current = {};
    }
  }, [isOpen]);

  // Load comments from API when popup opens or when comments are updated
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
  }, [isOpen, post?.id, post?.totalComments, commentRefreshTrigger]);

  // Automatically show comments when popup opens
  useEffect(() => {
    if (isOpen) {
      setShowComments(true);
    }
  }, [isOpen]);

  // Sync local state with post changes (reactions, comments, etc.)
  useEffect(() => {
    if (post && isOpen) {
      // Reset media index when post changes
      setCurrentMediaIndex(0);
      
      // Reset edit state when post changes
      if (isEditingPost && editContent !== post.content) {
        setIsEditingPost(false);
        setEditContent('');
      }
    }
  }, [post?.id, post?.totalReactions, post?.userReaction, post?.reactionsSummary, post?.comments.length, isOpen]);

  // Group-specific author mapping (hooks must be before any return)
  const { id: familyTreeId } = useParams<{ id: string }>();
  const [displayName, setDisplayName] = useState<string>(post?.author.name || '');
  const [displayAvatar, setDisplayAvatar] = useState<string>(post?.author.avatar || defaultPicture);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!post?.gpMemberId || !familyTreeId) return;
      const profile = await familyTreeMemberService.getGPMemberByMemberId(familyTreeId, post.gpMemberId);
      if (cancelled || !profile) return;
      const name = getDisplayNameFromGPMember(profile) || post.author.name;
      const avatar = getAvatarFromGPMember(profile) || post.author.avatar || defaultPicture;
      setDisplayName(name);
      setDisplayAvatar(avatar);
    })();
    return () => { cancelled = true; };
  }, [post?.gpMemberId, familyTreeId]);

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

  // Handle comment submission and refresh comments
  const handleCommentSubmit = () => {
    onCommentSubmit(post.id);
    // Trigger comment refresh after a short delay to allow API to process
    setTimeout(() => {
      setCommentRefreshTrigger(prev => prev + 1);
    }, 500);
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
                  {(() => {
                    const url = mediaList[currentMediaIndex].fileUrl;
                    const byUrl = isVideoUrl(url);
                    const byType = mediaList[currentMediaIndex].fileType === 1 || (mediaList[currentMediaIndex] as any).fileType === 'video';
                    const isVideo = byUrl || byType;
                    return isVideo;
                  })() ? (
                    <VideoWithThumbnail
                      key={mediaList[currentMediaIndex].id}
                      src={mediaList[currentMediaIndex].fileUrl}
                      className="max-w-full max-h-full object-contain"
                    />
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
                    src={displayAvatar}
                    alt={displayName}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = defaultPicture;
                    }}
                  />
                  <div>
                    <h3 className="font-semibold text-gray-900">{displayName}</h3>
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
                  <h3 className="font-semibold text-gray-900 text-lg">Bài viết của {displayName}</h3>
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
                  src={displayAvatar}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = defaultPicture;
                  }}
                />
                <div>
                  <h4 className="font-semibold text-gray-900">{displayName}</h4>
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

          

          {/* Post Stats - with reaction tooltip */}
          {reactionTypes.length > 0 && getReactionSummaryText && onReactionSummaryClick ? (
            <PostStats
              post={post}
              reactionTypes={reactionTypes}
              hoveredPost={effectiveHoveredPost}
              setHoveredPost={effectiveSetHoveredPost}
              tooltipShowTime={effectiveTooltipShowTime}
              isHoveringReactionPicker={effectiveIsHoveringReactionPicker}
              getReactionSummaryText={getReactionSummaryText}
              onReactionSummaryClick={onReactionSummaryClick}
            />
          ) : (
          <div className="px-4 py-3 border-b border-gray-200">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <div className="flex items-center space-x-1">
                  <span>{post.totalReactions || post.likes || 0} lượt thích</span>
              </div>
              <div>
                  {(post.totalComments || post.comments.length) > 0 && (
                    <span>{post.totalComments || post.comments.length} bình luận</span>
                )}
                </div>
              </div>
            </div>
          )}

          {/* Post Actions - with reaction picker */}
          {reactionTypes.length > 0 && onReaction ? (
            <PostActions
              post={post}
              reactionTypes={reactionTypes}
              showReactionPicker={effectiveShowReactionPicker}
              setShowReactionPicker={effectiveSetShowReactionPicker}
              onReaction={onReaction}
              onCommentClick={() => setShowComments(!showComments)}
              isInModal={false}
            />
          ) : null}

          {/* Comments Section */}
          <div className="flex-1 overflow-y-auto">
            <CommentArea
              comments={post.comments}
                        postId={post.id}
              showComments={showComments}
              loadingComments={loadingComments}
              CommentItem={CommentItem}
            />
          </div>

          {/* Comment Input */}
          <CommentInput
            postId={post.id}
            value={commentInputs[post.id] || ''}
            onChange={(value) => setCommentInputs(prev => ({ ...prev, [post.id]: value }))}
            onSubmit={handleCommentSubmit}
            userAvatar={userData?.picture || defaultPicture}
          />
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;
