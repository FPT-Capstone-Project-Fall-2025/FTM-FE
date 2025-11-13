import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import defaultPicture from '@/assets/dashboard/default-avatar.png';
import { MessageCircle, Image, X, ThumbsUp, Search, Edit, Trash2, Users, User, Share, Globe, Lock } from 'lucide-react';
import PostDetailPage from './PostDetailPage';
import PostCard, { CommentItem } from './components/PostCard';
import GPEventDetailsModal from '../Event/GPEventDetailsModal';
import postService, { type CreatePostData } from '@/services/postService';
import familyTreeService from '@/services/familyTreeService';
import familyTreeMemberService, { type GPMember, getAvatarFromGPMember, getDisplayNameFromGPMember } from '@/services/familyTreeMemberService';
import { getUserIdFromToken } from '@/utils/jwtUtils';
import userService from '@/services/userService';
import { useGPMember } from '@/hooks/useGPMember';
import { toast } from 'react-toastify';
import type { Post, Comment } from '../../types/post';

// Remove duplicate interfaces - now using shared types from './types'

const PostPage: React.FC = () => {
  const { user, token, isAuthenticated } = useAppSelector(state => state.auth);
  const { id: familyTreeId } = useParams<{ id: string }>();
  
  // Post management state
  const [posts, setPosts] = useState<Post[]>([]);
  const [initialLoading, setInitialLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Post creation state
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [fileCaptions, setFileCaptions] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [commentImages, setCommentImages] = useState<{ [key: string]: File[] }>({});
  const [_commentImagePreviews, _setCommentImagePreviews] = useState<{ [key: string]: string[] }>({});
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
  const [showEventModal, setShowEventModal] = useState(false);
  
  // Family tree details state
  const [familyTreeData, setFamilyTreeData] = useState<any>(null);
  const [familyTreeLoading, setFamilyTreeLoading] = useState(false);
  
  // User data state (similar to Navigation.tsx)
  const [userData, setUserData] = useState({ name: '', picture: '' });
  const [gpMemberMap, setGpMemberMap] = useState<Record<string, GPMember>>({});
  const [searchQuery, setSearchQuery] = useState('');

  // GPMember integration - Get GPMemberId for the current user in this family tree
  const currentUserId = getUserIdFromToken(token || '') || user?.userId;
  const currentFamilyTreeId = familyTreeId || null;
  
  const { 
    gpMemberId, 
    gpMember: _gpMember, 
    loading: gpMemberLoading, 
    error: gpMemberError 
  } = useGPMember(currentFamilyTreeId, currentUserId || null);
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editStatus, setEditStatus] = useState<number>(1); // 1 = public, 0 = private
  const [editImages, setEditImages] = useState<File[]>([]);
  const [editImagePreviews, setEditImagePreviews] = useState<string[]>([]);
  const [editCaptions, setEditCaptions] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<{id: string, url: string, caption?: string}[]>([]);
  const [imagesToRemove, setImagesToRemove] = useState<string[]>([]);
  const [isUpdatingPost, setIsUpdatingPost] = useState(false);
  const [showPostMenu, setShowPostMenu] = useState<string | null>(null);
  const [showCommentMenu, setShowCommentMenu] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
  const [showReportPostModal, setShowReportPostModal] = useState(false);
  const [reportingPostId, setReportingPostId] = useState<string | null>(null);
  const [postReportReason, setPostReportReason] = useState('');
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [replyingToComment, setReplyingToComment] = useState<string | null>(null);
  const [replyInputs, setReplyInputs] = useState<{ [key: string]: string }>({});
  const [collapsedReplies, setCollapsedReplies] = useState<{ [key: string]: boolean }>({});
  const [showPostDetail, setShowPostDetail] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [deletingPostIds, setDeletingPostIds] = useState<Set<string>>(new Set());
  const [createStatus, setCreateStatus] = useState<number>(1); // 1 = Công khai, 0 = Chỉ mình tôi

  // Comment editing states
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');


  // Reaction states
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [hoveredPost, setHoveredPost] = useState<string | null>(null);
  const [showReactionPopup, setShowReactionPopup] = useState<string | null>(null);
  
  // Ref to track pending reaction operations
  const pendingReactions = useRef<Set<string>>(new Set());
  
  // Ref to track tooltip hover timestamps (minimum 2s display)
  const tooltipShowTime = useRef<{ [postId: string]: number }>({});
  
  // Ref to track if hovering over reaction picker (prevent tooltip close)
  const isHoveringReactionPicker = useRef<{ [postId: string]: boolean }>({});

  // Search states
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Confirm Dialog states
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmDialogData, setConfirmDialogData] = useState<{
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmButtonClass?: string;
    onConfirm: () => void;
    onCancel?: () => void;
  } | null>(null);

  // Reaction types with numeric IDs for API
  const reactionTypes = [
    { type: 'Like', id: 1, emoji: '👍', label: 'Thích' },
    { type: 'Love', id: 2, emoji: '❤️', label: 'Yêu thích' },
    { type: 'Haha', id: 3, emoji: '😆', label: 'Haha' },
    { type: 'Wow', id: 4, emoji: '😮', label: 'Wow' },
    { type: 'Sad', id: 5, emoji: '😢', label: 'Buồn' },
    { type: 'Angry', id: 6, emoji: '😠', label: 'Giận dữ' }
  ];

  // Preload group member profiles map for avatar/name mapping
  useEffect(() => {
    if (!currentFamilyTreeId) return;
    let isMounted = true;
    (async () => {
      try {
        const treeResp = await familyTreeService.getFamilyTreeData(currentFamilyTreeId);
        const dataList = (treeResp.data as any)?.datalist || [];
        const memberIds: string[] = dataList
          .map((n: any) => n?.value?.id)
          .filter((id: any) => typeof id === 'string');
        const uniqueIds = Array.from(new Set(memberIds));
        const results = await Promise.all(
          uniqueIds.map(async (memberId) => {
            const profile = await familyTreeMemberService.getGPMemberByMemberId(currentFamilyTreeId, memberId);
            return [memberId, profile] as const;
          })
        );
        if (!isMounted) return;
        const map: Record<string, GPMember> = {};
        results.forEach(([memberId, profile]) => {
          if (profile) map[memberId] = profile;
        });
        setGpMemberMap(map);
      } catch {
        // ignore
      }
    })();
    return () => { isMounted = false; };
  }, [currentFamilyTreeId]);

  // Function to transform API comment to Comment interface
  const transformApiComment = (apiComment: any): Comment => {
    const memberProfile = apiComment.gpMemberId ? gpMemberMap[apiComment.gpMemberId] : undefined;
    const authorNameFromGroup = memberProfile ? (getDisplayNameFromGPMember(memberProfile) || undefined) : undefined;
    const avatarFromGroup = memberProfile ? (getAvatarFromGPMember(memberProfile) || undefined) : undefined;
    const comment: Comment = {
      id: apiComment.id || `comment-${Date.now()}-${Math.random()}`,
      gpMemberId: apiComment.gpMemberId,
      author: {
        name: authorNameFromGroup || apiComment.authorName || 'Unknown User',
        avatar: avatarFromGroup || apiComment.authorPicture || defaultPicture
      },
      content: apiComment.content || '',
      images: apiComment.attachments?.map((file: any) => file.url) || [],
      timeAgo: formatTimeAgo(apiComment.createdOn || new Date().toISOString()),
      likes: apiComment.totalReactions || 0,
      isLiked: apiComment.isLiked || false,
      isEdited: apiComment.isEdited || false,
      replies: apiComment.childComments ? apiComment.childComments.map(transformApiComment) : []
    };
    
    if (apiComment.lastModifiedOn) {
      comment.editedAt = formatTimeAgo(apiComment.lastModifiedOn);
    }
    
    return comment;
  };

  // Load posts from API
  const loadPosts = async () => {
    // Use familyTreeId from params or fallback to a default one for testing
    const currentFamilyTreeId = familyTreeId || '822994d5-7acd-41f8-b12b-e0a634d74440';
    
    if (!currentFamilyTreeId) {
      setError('Family Tree ID is required');
      return;
    }

    setInitialLoading(true);
    setError(null);
    try {
      const result = await postService.getPostsByFamilyTree(currentFamilyTreeId);
      
      
      // Handle both API response formats
      const success = result.success || result.status || (result.statusCode === 200);
      const responseData = result.data as any;
      
      // Handle paginated response or direct array
      const data = Array.isArray(responseData) 
        ? responseData 
        : (responseData?.data || []);
      
      if (success && data) {
        // Transform API data to match Post interface
        const transformedPosts: Post[] = data.map((apiPost: any) => {
          // Get current user reaction from API response
          const currentUserReaction = apiPost.currentUserReaction;
          const hasReacted = currentUserReaction?.hasReacted === true;
          const userReactionType = hasReacted ? currentUserReaction.reactionType : null;
          const userReactionId = hasReacted ? currentUserReaction.id : null;
          const memberProfile = apiPost.gpMemberId ? gpMemberMap[apiPost.gpMemberId] : undefined;
          const authorNameFromGroup = memberProfile ? (getDisplayNameFromGPMember(memberProfile) || undefined) : undefined;
          const avatarFromGroup = memberProfile ? (getAvatarFromGPMember(memberProfile) || undefined) : undefined;
          
          return {
            id: apiPost.id,
            title: apiPost.title,
            gpMemberId: apiPost.gpMemberId,
            status: Number(apiPost.status ?? 1),
            author: {
              name: authorNameFromGroup || apiPost.authorName || apiPost.author?.name || apiPost.createdBy || 'Unknown User',
              avatar: avatarFromGroup || apiPost.authorPicture || apiPost.author?.avatar || defaultPicture,
              timeAgo: formatTimeAgo(apiPost.createdOn || apiPost.createdAt || new Date().toISOString())
            },
            content: apiPost.content,
            images: apiPost.attachments?.map((file: any) => file.fileUrl || file.url) || apiPost.images || apiPost.files?.map((file: any) => file.url) || [],
            likes: apiPost.totalReactions || 0,
            totalReactions: apiPost.totalReactions || 0,
            reactionsSummary: apiPost.reactionsSummary || {},
            userReaction: userReactionType,
            userReactionId: userReactionId,
            isLiked: userReactionType === 'Like',
            // Use comments from API response (will include totalComments)
            comments: apiPost.comments?.map(transformApiComment) || [],
            totalComments: apiPost.totalComments || 0,
            isEdited: apiPost.lastModifiedOn !== apiPost.createdOn || apiPost.lastModifiedAt !== apiPost.createdAt,
            ...(apiPost.lastModifiedOn !== apiPost.createdOn || apiPost.lastModifiedAt !== apiPost.createdAt) && {
              editedAt: formatTimeAgo(apiPost.lastModifiedOn || apiPost.lastModifiedAt || new Date().toISOString())
            }
          };
        });
        
        setPosts(transformedPosts);
        
      } else {
        const errorMessage = result.message || result.errors || 'Failed to load posts';
        throw new Error(errorMessage);
      }
    } catch (error) {
      
      // More detailed error handling
      let errorMessage = 'Có lỗi xảy ra khi tải bài viết';
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null) {
        // Handle axios error or API error
        const apiError = error as any;
        if (apiError.response?.data?.message) {
          errorMessage = apiError.response.data.message;
        } else if (apiError.response?.data?.errors) {
          errorMessage = apiError.response.data.errors;
        } else if (apiError.message) {
          errorMessage = apiError.message;
        }
      }
      
      
      setError(errorMessage);
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    loadPosts();
  }, [familyTreeId]);

  // Log GPMemberId when it's loaded for debugging
  useEffect(() => {
    if (gpMemberId) {
    }
    if (gpMemberError) {
    }
  }, [gpMemberId, gpMemberError]);

  // Function to load reactions for a post
  const loadPostReactions = async (postId: string) => {
    try {
      const result = await postService.getPostReactions(postId);
      const success = result.success || result.status || (result.statusCode === 200);
      
      if (success && result.data) {
        
        // Handle paginated response or direct array
        const reactionsData = Array.isArray(result.data) 
          ? result.data 
          : ((result.data as any)?.data || []);
        
        
        // Check if current user has reacted using gpMemberId and hasReacted flag
        const userReaction = reactionsData.find((reaction: any) => {
          return reaction.gpMemberId === gpMemberId && reaction.hasReacted === true;
        });
        
        
        if (userReaction) {
        } else {
        }
        
        // Update post with user reaction and reactionId
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                userReaction: userReaction?.reactionType || null,
                userReactionId: userReaction?.id || null, // Store reaction ID for deletion
                isLiked: userReaction?.reactionType === 'Like'
              }
            : post
        ));
      }
    } catch (error) {
    }
  };

  // Function to handle reaction click
  const handleReaction = async (postId: string, reactionType: string) => {
    // Create unique key for this operation
    const operationKey = `${postId}-${reactionType}`;
    
    // Check if this exact operation is already pending
    if (pendingReactions.current.has(operationKey)) {
      return;
    }
    
    try {
      // Mark operation as pending
      pendingReactions.current.add(operationKey);
      
      if (!gpMemberId) {
        toast.error('Không thể xác định thành viên gia phả. Vui lòng thử lại!');
        return;
      }

      if (!postId) {
        toast.error('Không tìm thấy bài viết!');
        return;
      }

      const post = posts.find(p => p.id === postId);
      if (!post) {
        toast.error('Không tìm thấy bài viết!');
        return;
      }

      // Check if this post is already being processed (prevent rapid clicks)
      if ((post as any).isProcessingReaction) {
        return;
      }

      // Find the numeric reaction ID from reactionType string
      const reactionConfig = reactionTypes.find(r => r.type === reactionType);
      if (!reactionConfig) {
        toast.error('Loại phản ứng không hợp lệ!');
        return;
      }


      // Set processing flag to prevent rapid clicks
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, isProcessingReaction: true } as any : p
      ));

      // Check if user already has any reaction to prevent duplicate

      // If user already has this reaction, remove it (toggle off)
      // This handles the case when hasReacted: true and user clicks the same reaction again
      if (post.userReaction === reactionType) {
        
        // Use the stored reaction ID for deletion
        if (!post.userReactionId) {
          toast.error('Không tìm thấy ID phản ứng. Vui lòng thử lại!');
          // Clear processing flag
          setPosts(prev => prev.map(p => 
            p.id === postId ? { ...p, isProcessingReaction: false } as any : p
          ));
          pendingReactions.current.delete(operationKey);
          return;
        }
        
        const removeResult = await postService.removePostReaction(post.userReactionId);
        
        
        if (!removeResult.status) {
          throw new Error(removeResult.message || 'Không thể xóa phản ứng');
        }
        
        
        // Update state immediately (frontend calculation) - set userReaction to null
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            const newReactionsSummary = { ...p.reactionsSummary };
            const reactionKey = reactionType.toLowerCase();
            
            // Decrease count for removed reaction
            if (newReactionsSummary[reactionKey]) {
              newReactionsSummary[reactionKey]--;
              if (newReactionsSummary[reactionKey] === 0) {
                delete newReactionsSummary[reactionKey];
              }
            }
            
            
            return {
              ...p,
              userReaction: null,  // hasReacted is now false
              userReactionId: null,
              totalReactions: Math.max(0, p.totalReactions - 1),
              reactionsSummary: newReactionsSummary,
              isLiked: false,
              isProcessingReaction: false
            } as any;
          }
          return p;
        }));
        
        // Also update selectedPost if it's the same post (for modal)
        if (selectedPost?.id === postId) {
          setSelectedPost(prev => {
            if (!prev) return null;
            const newReactionsSummary = { ...prev.reactionsSummary };
            const reactionKey = reactionType.toLowerCase();
            
            if (newReactionsSummary[reactionKey]) {
              newReactionsSummary[reactionKey]--;
              if (newReactionsSummary[reactionKey] === 0) {
                delete newReactionsSummary[reactionKey];
              }
            }
            
            return {
              ...prev,
              userReaction: null,
              userReactionId: null,
              totalReactions: Math.max(0, prev.totalReactions - 1),
              reactionsSummary: newReactionsSummary,
              isLiked: false
            };
          });
        }
      } else {
        // If user has a different reaction, remove it first and WAIT (REQUIRED)
        if (post.userReaction && post.userReactionId) {
          
          const removeResult = await postService.removePostReaction(post.userReactionId);
          
          if (!removeResult.status) {
            // Clear processing flag
            setPosts(prev => prev.map(p => 
              p.id === postId ? { ...p, isProcessingReaction: false } as any : p
            ));
            throw new Error(removeResult.message || 'Phải xóa phản ứng cũ trước khi thêm phản ứng mới');
          }
          
          // Brief wait to ensure backend processes deletion before adding new reaction
          await new Promise(resolve => setTimeout(resolve, 300));
        } else {
        }
        
        // Add new reaction using new API format
        const reactionPayload = {
          postId: postId,
          gpMemberId: gpMemberId,
          reactionType: reactionConfig.id // Use numeric ID (1-6)
        };
        
        
        const response = await postService.addPostReaction(reactionPayload);
        
        
        // Check if response is successful
        if (!response.status) {
          throw new Error(response.message || 'Không thể thêm phản ứng');
        }
        
        // Extract the new reaction ID and type from response
        // API returns: { status: true, data: { id: "...", postId: "...", reactionType: "Haha", hasReacted: true, ... } }
        const newReactionId = response.data?.id || response.data?.data?.id || response.data;
        const actualReactionType = response.data?.reactionType || reactionType;
        const hasReacted = response.data?.hasReacted ?? true;
        
        
        if (!newReactionId) {
        }
        
        // Update state immediately (frontend calculation)
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            const newReactionsSummary = { ...p.reactionsSummary };
            
            // If changing from one reaction to another, decrease old count
            if (p.userReaction) {
              const oldReactionKey = p.userReaction.toLowerCase();
              if (newReactionsSummary[oldReactionKey]) {
                newReactionsSummary[oldReactionKey]--;
                if (newReactionsSummary[oldReactionKey] === 0) {
                  delete newReactionsSummary[oldReactionKey];
                }
              }
            }
            
            // Increase count for new reaction (use actualReactionType from API response)
            const newReactionKey = actualReactionType.toLowerCase();
            newReactionsSummary[newReactionKey] = (newReactionsSummary[newReactionKey] || 0) + 1;
            
            // Total reactions: increase only if user had no previous reaction
            const totalChange = p.userReaction ? 0 : 1;
            
            return {
              ...p,
              userReaction: hasReacted ? actualReactionType : null,
              userReactionId: hasReacted ? newReactionId : null,
              totalReactions: p.totalReactions + totalChange,
              reactionsSummary: newReactionsSummary,
              isLiked: actualReactionType === 'Like' && hasReacted,
              isProcessingReaction: false
            } as any;
          }
          return p;
        }));
        
        // Also update selectedPost if it's the same post (for modal)
        if (selectedPost?.id === postId) {
          setSelectedPost(prev => {
            if (!prev) return null;
            const newReactionsSummary = { ...prev.reactionsSummary };
            
            // If changing from one reaction to another, decrease old count
            if (prev.userReaction) {
              const oldReactionKey = prev.userReaction.toLowerCase();
              if (newReactionsSummary[oldReactionKey]) {
                newReactionsSummary[oldReactionKey]--;
                if (newReactionsSummary[oldReactionKey] === 0) {
                  delete newReactionsSummary[oldReactionKey];
                }
              }
            }
            
            // Increase count for new reaction
            const newReactionKey = actualReactionType.toLowerCase();
            newReactionsSummary[newReactionKey] = (newReactionsSummary[newReactionKey] || 0) + 1;
            
            // Total reactions: increase only if user had no previous reaction
            const totalChange = prev.userReaction ? 0 : 1;
            
            return {
              ...prev,
              userReaction: hasReacted ? actualReactionType : null,
              userReactionId: hasReacted ? newReactionId : null,
              totalReactions: prev.totalReactions + totalChange,
              reactionsSummary: newReactionsSummary,
              isLiked: actualReactionType === 'Like' && hasReacted
            };
          });
        }
      }
      
      setShowReactionPicker(null);
      
      // Unlock operation immediately (frontend calculation is already done)
      pendingReactions.current.delete(operationKey);
      
    } catch (error: any) {
      
      // Clear processing flag on error
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, isProcessingReaction: false } as any : p
      ));
      
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi thả cảm xúc';
      toast.error(`Lỗi phản ứng: ${errorMessage}`);
      
      // Reload reactions AND summary from server to sync state after error
      await Promise.all([
        loadPostReactions(postId),
        loadReactionSummary(postId)
      ]);
      
      // Unlock operation after error
      pendingReactions.current.delete(operationKey);
    }
  };

  // Function to get reaction summary text (top 3 reactions with emojis)
  const getReactionSummaryText = (post: Post): string => {
    const summary = post.reactionsSummary;
    const entries = Object.entries(summary);
    
    if (entries.length === 0) return '';
    
    const reactionEmojis: { [key: string]: string } = {
      like: '👍',
      love: '❤️',
      haha: '😆',
      wow: '😮',
      sad: '😢',
      angry: '😠'
    };
    
    const sortedEntries = entries.sort((a, b) => b[1] - a[1]);
    const topReactions = sortedEntries.slice(0, 3);
    
    return topReactions.map(([type]) => 
      reactionEmojis[type.toLowerCase()] || '👍'
    ).join('');
  };

  // Function to load reaction summary for a post
  const loadReactionSummary = async (postId: string) => {
    try {
      const result = await postService.getPostReactionSummary(postId);
      const success = result.success || result.status || (result.statusCode === 200);
      
      if (success && result.data) {
        
        // Calculate total reactions from summary
        const totalReactions = Object.values(result.data).reduce((sum: number, count: any) => sum + (Number(count) || 0), 0);
        
        
        // Update post with reaction summary AND total count
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                reactionsSummary: result.data,
                totalReactions: totalReactions
              }
            : post
        ));
      }
    } catch (error) {
    }
  };

  // Function to handle reaction summary click (show popup)
  const handleReactionSummaryClick = (postId: string) => {
    setShowReactionPopup(postId);
  };

  // Load family tree details
  useEffect(() => {
    const loadFamilyTreeDetails = async () => {
      const currentFamilyTreeId = familyTreeId || '822994d5-7acd-41f8-b12b-e0a634d74440';
      
      if (!currentFamilyTreeId) return;

      setFamilyTreeLoading(true);
      try {
        const result = await familyTreeService.getFamilyTreeById(currentFamilyTreeId);
        
        // Handle both API response formats
        const success = result.success || result.status || (result.statusCode === 200);
        const data = result.data;
        
        if (success && data) {
          setFamilyTreeData(data);
        } else {
        }
      } catch (error) {
      } finally {
        setFamilyTreeLoading(false);
      }
    };

    loadFamilyTreeDetails();
  }, [familyTreeId]);

  // Fetch user data (similar to Navigation.tsx)
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const response = await userService.getProfileData();
        setUserData(prev => ({
          ...prev,
          name: response.data.name,
          picture: response.data.picture
        }));
      } catch (error) {
      }
    };
    fetchInitialData();
  }, []);

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

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length + selectedImages.length > 4) {
      toast.error('Chỉ có thể tải lên tối đa 4 ảnh');
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`File ${file.name} quá lớn. Kích thước tối đa là 5MB`);
        return false;
      }
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/avi', 'video/mov'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File ${file.name} không đúng định dạng. Chỉ chấp nhận JPEG, JPG, PNG, GIF, MP4, AVI, MOV`);
        return false;
      }
      return true;
    });

    setSelectedImages(prev => [...prev, ...validFiles]);
    
    // Initialize captions for new files
    setFileCaptions(prev => [...prev, ...validFiles.map(() => '')]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
    setFileCaptions(prev => prev.filter((_, i) => i !== index));
  };

  const updateFileCaption = (index: number, caption: string) => {
    setFileCaptions(prev => {
      const newCaptions = [...prev];
      newCaptions[index] = caption;
      return newCaptions;
    });
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() && selectedImages.length === 0) {
      toast.error('Vui lòng nhập nội dung bài viết hoặc chọn ảnh');
      return;
    }

    // Validate content length
    if (postContent.trim().length > 5000) {
      toast.error('Nội dung bài viết không được vượt quá 5000 ký tự');
      return;
    }

    // Validate title length if provided
    if (postTitle.trim().length > 200) {
      toast.error('Tiêu đề bài viết không được vượt quá 200 ký tự');
      return;
    }

    // Use familyTreeId from params or fallback to a default one for testing
    const currentFamilyTreeId = familyTreeId || '374a1ace-479b-435b-9bcf-05ea83ef7d17'; // Use the same ID as in curl example
    
    if (!currentFamilyTreeId) {
      toast.error('Không tìm thấy ID gia phả');
      return;
    }

    if (!token || !isAuthenticated) {
      toast.error('Bạn cần đăng nhập để tạo bài viết');
      return;
    }

    setIsPosting(true);

    try {
      // Use gpMemberId from hook instead of manually extracting from token
      if (!gpMemberId) {
        if (gpMemberLoading) {
          toast.warning('Đang tải thông tin thành viên gia phả. Vui lòng thử lại sau.');
          return;
        }
        if (gpMemberError) {
          toast.error(`Lỗi khi lấy thông tin thành viên gia phả: ${gpMemberError}`);
          return;
        }
        toast.error('Không thể xác định thông tin thành viên trong gia phả. Vui lòng kiểm tra lại.');
        return;
      }
      
      
      // Debug logging for arrays
      
      // Prepare data according to API structure
      const postData: CreatePostData = {
        GPId: currentFamilyTreeId,
        Title: postTitle.trim() || '',  // Allow empty title
        Content: postContent.trim() || '', // Ensure Content is never undefined
        GPMemberId: gpMemberId,
        Status: createStatus,
        Files: selectedImages.length > 0 ? selectedImages : undefined,
        Captions: selectedImages.length > 0 ? fileCaptions : undefined,
        // Temporarily disable FileTypes to test if it's causing the validation error
        // FileTypes: selectedImages.length > 0 ? selectedImages.map((file, index) => {
        //   if (file.type.startsWith('image/')) return 'Image';
        //   if (file.type.startsWith('video/')) return 'Video';
        //   return 'File';
        // }) : undefined
      };


      const response = await postService.createPost(postData);
      

      // Handle both API response formats
      const success = response.success || response.status || (response.statusCode === 200);
      const data = response.data;

      if (success && data) {
        // Transform API response to Post interface
        const newPost: Post = {
          id: data.id,
          title: data.title,
          gpMemberId: data.gpMemberId,
          author: {
            name: data.authorName || userData.name || 'Username',
            avatar: data.authorPicture || userData.picture || defaultPicture,
            timeAgo: 'Vừa xong'
          },
          content: data.content,
          // Store full attachment info (NEW)
          attachments: data.attachments?.map((file: any) => ({
            id: file.id,
            fileUrl: file.fileUrl || file.url,
            fileType: file.fileType,
            caption: file.caption,
            createdOn: file.createdOn
          })) || [],
          // Keep images for backward compatibility
          images: data.attachments?.map((file: any) => file.fileUrl || file.url) || [],
          likes: data.totalReactions || 0,
          totalReactions: data.totalReactions || 0,
          totalComments: data.totalComments || 0,
          reactionsSummary: data.reactionsSummary || {},
          userReaction: null,
          userReactionId: null,
          isLiked: false,
          comments: data.comments || []
        };


        setPosts(prev => [newPost, ...prev]);
        
        // Close modal and reset form
        handleCloseCreatePostModal();
        
        toast.success('Bài viết đã được tạo thành công!');
      } else {
        throw new Error(response.message || 'Failed to create post');
      }
    } catch (error: any) {
      
      // More specific error messages
      let errorMessage = 'Có lỗi xảy ra khi tạo bài viết. Vui lòng thử lại!';
      
      if (error.response?.status === 400) {
        // Check for validation errors
        const validationErrors = error.response?.data?.errors;
        if (validationErrors) {
          const errorMessages = Object.entries(validationErrors)
            .map(([field, messages]: [string, any]) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(', ')}`;
              }
              return `${field}: ${messages}`;
            })
            .join('\n');
          errorMessage = `Lỗi validation:\n${errorMessages}`;
        } else {
          errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
        }
      } else if (error.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Bạn không có quyền thực hiện hành động này.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsPosting(false);
    }
  };

  const handleCloseCreatePostModal = () => {
    // Reset form when closing modal
    setPostTitle('');
    setPostContent('');
    setSelectedImages([]);
    setImagePreviews([]);
    setFileCaptions([]);
    setShowCreatePostModal(false);
  };

  // Handle event creation and auto-create linked post
  const handleEventCreated = async () => {
    if (!currentFamilyTreeId) {
      return;
    }

    // Fetch the latest events to get the newly created event
    try {
      const response = await postService.getPostsByFamilyTree(currentFamilyTreeId);
      
      // Get the latest event (assuming it's the first one)
      // In a real scenario, you would get the event ID from the creation response
      
      // For now, we'll just refresh the posts to include any auto-created posts
      if (response.data && (response.data as any).data) {
        const fetchedPosts = (response.data as any).data.map((post: any) => ({
          id: post.id,
          title: post.title,
          gpMemberId: post.gpMemberId,
          author: {
            name: post.authorName || 'Unknown',
            avatar: post.authorPicture || defaultPicture,
            timeAgo: post.timeAgo || 'Vừa xong'
          },
          content: post.content,
          attachments: post.attachments?.map((file: any) => ({
            id: file.id,
            fileUrl: file.fileUrl || file.url,
            fileType: file.fileType,
            caption: file.caption,
            createdOn: file.createdOn
          })) || [],
          images: post.attachments?.map((file: any) => file.fileUrl || file.url) || [],
          likes: post.totalReactions || 0,
          totalReactions: post.totalReactions || 0,
          totalComments: post.totalComments || 0,
          reactionsSummary: post.reactionsSummary || {},
          userReaction: post.userReaction || null,
          userReactionId: post.userReactionId || null,
          isLiked: post.userReaction === 'Like',
          comments: post.comments || []
        }));
        
        setPosts(fetchedPosts);
        toast.success('Sự kiện và bài viết đã được tạo thành công!');
      }
    } catch (error) {
    }
    
    setShowEventModal(false);
  };


  const handleLike = (id: string, type: 'post' | 'comment', postId?: string) => {
    // Validation
    if (!id || !type) {
      return;
    }

    if (type === 'comment' && !postId) {
      return;
    }

    if (type === 'post') {
      // Handle post like
      setPosts(prev => prev.map(post =>
        post.id === id
          ? {
            ...post,
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
          : post
      ));

      // Also update selectedPost if it's the same post
      if (selectedPost?.id === id) {
        setSelectedPost(prev => prev ? {
          ...prev,
          isLiked: !prev.isLiked,
          likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1
        } : null);
      }
    } else if (type === 'comment' && postId) {
      // Handle comment like
      setPosts(prev => prev.map(post =>
        post.id === postId
          ? {
            ...post,
            comments: post.comments.map(comment =>
              comment.id === id
                ? {
                  ...comment,
                  isLiked: !comment.isLiked,
                  likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1
                }
                : comment
            )
          }
          : post
      ));

      // Also update selectedPost if it's the same post
      if (selectedPost?.id === postId) {
        setSelectedPost(prev => prev ? {
          ...prev,
          comments: prev.comments.map(comment =>
            comment.id === id
              ? {
                ...comment,
                isLiked: !comment.isLiked,
                likes: comment.isLiked ? comment.likes - 1 : comment.likes + 1
              }
              : comment
          )
        } : null);
      }
    }
  };

  const handleCommentSubmit = async (postId: string) => {
    const commentText = commentInputs[postId]?.trim();
    const images = commentImages[postId] || [];

    if (!commentText && images.length === 0) {
      toast.error('Vui lòng nhập nội dung bình luận');
      return;
    }

    if (!gpMemberId) {
      toast.error('Không thể xác định thành viên gia phả. Vui lòng thử lại!');
      return;
    }

    try {
      // Submit comment to API with new format
      const result = await postService.addComment({
        postId: postId,
        gpMemberId: gpMemberId,
        content: commentText || '',
      });
      
      
      // Handle both API response formats
      const success = result.success || result.status || (result.statusCode === 200);
      const data = result.data;
      
      if (success && data) {
        // Create new comment from API response
        const newComment: Comment = {
          id: data.id || `${postId}-${Date.now()}`,
          gpMemberId: data.gpMemberId || gpMemberId,
          author: {
            name: data.authorName || userData.name || getCurrentUserName(),
            avatar: data.authorPicture || userData.picture || defaultPicture
          },
          content: data.content || commentText || '',
          // Handle multiple possible URL fields for attachments
          images: data.attachments?.map((file: any) => file.fileUrl || file.url) || [],
          timeAgo: 'Vừa xong',
          likes: data.totalReactions || 0,
          isLiked: false,
          replies: []
        };

        // Update posts state with new comment
        setPosts(prev => prev.map(post =>
          post.id === postId
            ? { 
                ...post, 
                comments: [...post.comments, newComment],
                totalComments: (post.totalComments ?? post.comments.length) + 1
              }
            : post
        ));

        // Also update selectedPost if it's the same post (for modal)
        if (selectedPost?.id === postId) {
          setSelectedPost(prev => prev ? {
            ...prev,
            comments: [...prev.comments, newComment],
            totalComments: (prev.totalComments ?? prev.comments.length) + 1
          } : null);
        }

        // Clear comment input and images
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        setCommentImages(prev => ({ ...prev, [postId]: [] }));
        _setCommentImagePreviews(prev => ({ ...prev, [postId]: [] }));
        
        toast.success('Đã gửi bình luận');
      } else {
        throw new Error(result.message || 'Failed to submit comment');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi gửi bình luận';
      toast.error(errorMessage);
    }
  };

  // Facebook-style edit post handler
  const handleEditPost = (postId: string, content: string, title?: string) => {

    // Find the post to check ownership
    const postToEdit = posts.find(post => post.id === postId);

    if (!postToEdit) {
      toast.error('Bài viết không tồn tại!');
      setShowPostMenu(null);
      return;
    }

    // Check if user is logged in
    if (!isAuthenticated || !token) {
      toast.error('Bạn cần đăng nhập để thực hiện hành động này!');
      setShowPostMenu(null);
      return;
    }

    // Check if the current user is the author of the post
    if (!isCurrentUserPost(postToEdit.gpMemberId)) {
      toast.error('Bạn chỉ có thể chỉnh sửa bài viết của chính mình!');
      setShowPostMenu(null);
      return;
    }

    
    // Initialize edit state
    setEditingPostId(postId);
    setEditContent(content);
    setEditTitle(title || postToEdit.title || '');
    setEditStatus(1); // Default to public, TODO: get from post data
    
    // Initialize existing images
    const existingImgs = postToEdit.images?.map((url, index) => ({
      id: `existing-${index}`, // Temporary ID for existing images
      url: url,
      caption: '' // TODO: get from post data if available
    })) || [];
    setExistingImages(existingImgs);
    
    // Reset edit states
    setEditImages([]);
    setEditImagePreviews([]);
    setEditCaptions([]);
    setImagesToRemove([]);
    
    setShowPostMenu(null);
  };

  const handleSaveEdit = async (postId: string) => {
    if (!editContent.trim() && editImages.length === 0 && existingImages.length === imagesToRemove.length) {
      toast.error('Bài viết không thể trống');
      return;
    }

    if (!gpMemberId) {
      toast.error('Không thể xác định thành viên gia phả. Vui lòng thử lại!');
      return;
    }

    setIsUpdatingPost(true);

    try {
      const currentFamilyTreeId = familyTreeId || '822994d5-7acd-41f8-b12b-e0a634d74440';
      
      // Prepare update data - ensure Content is never empty for API validation
      const updateData: any = {
        Title: editTitle.trim(),
        Content: editContent.trim() || ' ', // Ensure content is never empty string
        Status: editStatus,
        GPId: currentFamilyTreeId, // Include Family Tree ID
        GPMemberId: gpMemberId, // Include GPMemberId for ownership verification
      };
      
      if (editImages.length > 0) {
        updateData.Files = editImages;
        updateData.Captions = editCaptions;
      }
      
      if (imagesToRemove.length > 0) {
        updateData.RemoveImageIds = imagesToRemove;
      }

      const response = await postService.updatePostWithFiles(postId, updateData);

      const success = response.success || response.status || (response.statusCode === 200);
      if (success && response.data) {
        // Update local post data
        setPosts(prev => prev.map(post =>
          post.id === postId ? {
            ...post,
            title: response.data.title,
            content: response.data.content,
            // Handle multiple possible URL fields for attachments
            images: response.data.attachments?.map((file: any) => file.fileUrl || file.url) || [],
            isEdited: true,
            editedAt: 'Vừa xong'
          } : post
        ));

        // Also update selectedPost if it's the same post being edited
        if (selectedPost?.id === postId) {
          setSelectedPost(prev => prev ? {
            ...prev,
            title: response.data.title,
            content: response.data.content,
            // Handle multiple possible URL fields for attachments
            images: response.data.attachments?.map((file: any) => file.fileUrl || file.url) || [],
            isEdited: true,
            editedAt: 'Vừa xong'
          } : null);
        }

        // Reset edit state
        handleCancelEdit();
        toast.success('Cập nhật bài viết thành công!');
      } else {
        throw new Error(response.message || 'Failed to update post');
      }
    } catch (error: any) {
      
      let errorMessage = 'Có lỗi xảy ra khi cập nhật bài viết. Vui lòng thử lại!';
      
      if (error.response?.status === 400) {
        const responseData = error.response?.data;
        
        // Check for validation errors in different formats
        if (responseData?.errors) {
          const errorMessages = Object.entries(responseData.errors)
            .map(([field, messages]: [string, any]) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(', ')}`;
              }
              return `${field}: ${messages}`;
            })
            .join('\n');
          errorMessage = `Lỗi validation:\n${errorMessages}`;
        } else if (responseData?.message) {
          errorMessage = `Lỗi API: ${responseData.message}`;
        } else if (responseData?.title) {
          errorMessage = `Lỗi API: ${responseData.title}`;
        } else {
          errorMessage = `Lỗi API 400: ${JSON.stringify(responseData)}`;
        }
      } else if (error.response?.data?.message) {
        errorMessage = `Lỗi: ${error.response.data.message}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsUpdatingPost(false);
    }
  };

  // Handle adding new images to edit
  const handleEditImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`File ${file.name} quá lớn. Kích thước tối đa là 5MB`);
        return false;
      }
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/avi', 'video/mov'];
      if (!allowedTypes.includes(file.type)) {
        toast.error(`File ${file.name} không đúng định dạng. Chỉ chấp nhận JPEG, JPG, PNG, GIF, MP4, AVI, MOV`);
        return false;
      }
      return true;
    });

    setEditImages(prev => [...prev, ...validFiles]);
    setEditCaptions(prev => [...prev, ...validFiles.map(() => '')]);

    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditImagePreviews(prev => [...prev, e.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove new image from edit
  const removeEditImage = (index: number) => {
    setEditImages(prev => prev.filter((_, i) => i !== index));
    setEditImagePreviews(prev => prev.filter((_, i) => i !== index));
    setEditCaptions(prev => prev.filter((_, i) => i !== index));
  };

  // Remove existing image from edit
  const removeExistingImage = (imageId: string) => {
    setImagesToRemove(prev => [...prev, imageId]);
    setExistingImages(prev => prev.filter(img => img.id !== imageId));
  };

  // Update caption for new images
  const updateEditCaption = (index: number, caption: string) => {
    setEditCaptions(prev => {
      const newCaptions = [...prev];
      newCaptions[index] = caption;
      return newCaptions;
    });
  };

  // Cancel edit and reset all states
  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditContent('');
    setEditTitle('');
    setEditStatus(1);
    setEditImages([]);
    setEditImagePreviews([]);
    setEditCaptions([]);
    setExistingImages([]);
    setImagesToRemove([]);
  };

  // Show confirm dialog helper
  const showConfirm = (
    title: string,
    message: string,
    onConfirm: () => void,
    options?: {
      confirmText?: string;
      cancelText?: string;
      confirmButtonClass?: string;
      onCancel?: () => void;
    }
  ) => {
    setConfirmDialogData({
      title,
      message,
      confirmText: options?.confirmText || 'Xác nhận',
      cancelText: options?.cancelText || 'Hủy',
      confirmButtonClass: options?.confirmButtonClass || 'bg-blue-600 hover:bg-blue-700',
      onConfirm: () => {
        setShowConfirmDialog(false);
        setConfirmDialogData(null);
        onConfirm();
      },
      onCancel: () => {
        setShowConfirmDialog(false);
        setConfirmDialogData(null);
        options?.onCancel?.();
      }
    });
    setShowConfirmDialog(true);
  };

  // Copy link function
  const handleCopyLink = async () => {
    try {
      const currentFamilyTreeId = familyTreeId || '822994d5-7acd-41f8-b12b-e0a634d74440';
      const groupUrl = `${window.location.origin}/group/${currentFamilyTreeId}`;
      await navigator.clipboard.writeText(groupUrl);
      toast.success('Đã sao chép link vào clipboard!');
      setShowSharePopup(false);
    } catch (err) {
      toast.error('Không thể sao chép link. Vui lòng thử lại!');
    }
  };

  // Handler for modal post editing
  const handleModalEditPost = (postId: string, newContent: string) => {

    // Find the post to check ownership before saving
    const postToEdit = posts.find(post => post.id === postId);

    if (!postToEdit) {
      toast.error('Bài viết không tồn tại!');
      return;
    }

    // Check if user is logged in
    if (!isAuthenticated || !token) {
      toast.error('Bạn cần đăng nhập để thực hiện hành động này!');
      return;
    }

    // Check if the current user is the author of the post
    if (!isCurrentUserPost(postToEdit.gpMemberId)) {
      toast.error('Bạn chỉ có thể chỉnh sửa bài viết của chính mình!');
      return;
    }


    setPosts(prev => prev.map(post =>
      post.id === postId ? {
        ...post,
        content: newContent,
        isEdited: true,
        editedAt: 'Vừa xong'
      } : post
    ));

    // Also update selectedPost if it's the same post being edited
    if (selectedPost?.id === postId) {
      setSelectedPost(prev => prev ? {
        ...prev,
        content: newContent,
        isEdited: true,
        editedAt: 'Vừa xong'
      } : null);
    }

  };

  // Handler for editing a comment
  const handleEditComment = async (postId: string, commentId: string) => {
    if (!editCommentContent.trim()) {
      toast.error('Nội dung bình luận không thể trống');
      return;
    }

    if (!gpMemberId) {
      toast.error('Không thể xác định thành viên gia phả. Vui lòng thử lại!');
      return;
    }

    try {
      const result = await postService.updateComment(commentId, {
        content: editCommentContent.trim(),
      });

      const success = result.success || result.status || (result.statusCode === 200);

      if (success) {
        // Update comment in state
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: updateCommentInTree(post.comments, commentId, editCommentContent.trim())
            };
          }
          return post;
        }));

        // Clear edit state
        setEditingCommentId(null);
        setEditCommentContent('');

        toast.success('Đã cập nhật bình luận');
      } else {
        throw new Error(result.message || 'Failed to update comment');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật bình luận');
    }
  };

  // Helper function to update comment in tree
  const updateCommentInTree = (comments: Comment[], commentId: string, newContent: string): Comment[] => {
    return comments.map(comment => {
      if (comment.id === commentId) {
        return {
          ...comment,
          content: newContent,
          isEdited: true,
          editedAt: 'Vừa xong'
        };
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: updateCommentInTree(comment.replies, commentId, newContent)
        };
      }
      return comment;
    });
  };

  // Handler for deleting a comment
  const handleDeleteComment = async (postId: string, commentId: string) => {
    showConfirm(
      'Xóa bình luận',
      'Bạn có chắc chắn muốn xóa bình luận này không?',
      async () => {
        try {
          const result = await postService.deleteComment(commentId);
          const success = result.success || result.status || (result.statusCode === 200);

          if (success) {
            // Remove comment from state
            setPosts(prev => prev.map(post => {
              if (post.id === postId) {
                const updatedComments = deleteCommentFromTree(post.comments, commentId);
                return {
                  ...post,
                  comments: updatedComments,
                  totalComments: (post.totalComments ?? post.comments.length) - 1
                };
              }
              return post;
            }));

            // Also update selectedPost if it's the same post (for modal)
            if (selectedPost?.id === postId) {
              setSelectedPost(prev => {
                if (!prev) return null;
                const updatedComments = deleteCommentFromTree(prev.comments, commentId);
                return {
                  ...prev,
                  comments: updatedComments,
                  totalComments: (prev.totalComments ?? prev.comments.length) - 1
                };
              });
            }

            toast.success('Đã xóa bình luận');
          } else {
            throw new Error(result.message || 'Failed to delete comment');
          }
        } catch (error: any) {
          toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa bình luận');
        }
      },
      {
        confirmText: 'Xóa',
        cancelText: 'Hủy',
        confirmButtonClass: 'bg-red-600 hover:bg-red-700'
      }
    );
  };

  // Helper function to delete comment from tree
  const deleteCommentFromTree = (comments: Comment[], commentId: string): Comment[] => {
    return comments
      .filter(comment => comment.id !== commentId)
      .map(comment => {
        if (comment.replies && comment.replies.length > 0) {
          return {
            ...comment,
            replies: deleteCommentFromTree(comment.replies, commentId)
          };
        }
        return comment;
      });
  };

  // Handler for reporting a comment
  const handleReportComment = (commentId: string) => {
    setReportingCommentId(commentId);
    setShowReportModal(true);
  };

  // Handler for submitting comment report
  const handleSubmitReport = async () => {
    if (!reportReason.trim()) {
      toast.error('Vui lòng nhập lý do báo cáo');
      return;
    }

    try {
      // Call API to report comment
      const result = await postService.reportComment(reportingCommentId!, reportReason.trim());
      const success = result.success || result.status || (result.statusCode === 200);

      if (success) {
        toast.success('Đã gửi báo cáo. Chúng tôi sẽ xem xét trong thời gian sớm nhất!');
        setShowReportModal(false);
        setReportingCommentId(null);
        setReportReason('');
      } else {
        throw new Error(result.message || 'Failed to report comment');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi gửi báo cáo');
    }
  };

  // Handler for submitting reply
  const handleReplySubmit = async (postId: string, parentCommentId: string) => {
    const replyText = replyInputs[parentCommentId]?.trim();

    if (!replyText) {
      toast.error('Vui lòng nhập nội dung trả lời');
      return;
    }

    if (!gpMemberId) {
      toast.error('Không thể xác định thành viên gia phả. Vui lòng thử lại!');
      return;
    }

    try {
      const result = await postService.addComment({
        postId: postId,
        gpMemberId: gpMemberId,
        content: replyText,
        parentCommentId: parentCommentId,
      });

      const success = result.success || result.status || (result.statusCode === 200);
      const data = result.data;

      if (success && data) {
        const newReply: Comment = {
          id: data.id || `${parentCommentId}-reply-${Date.now()}`,
          gpMemberId: data.gpMemberId || gpMemberId,
          author: {
            name: data.authorName || userData.name || user?.name || 'Username',
            avatar: data.authorPicture || userData.picture || defaultPicture
          },
          content: data.content || replyText,
          timeAgo: 'Vừa xong',
          likes: data.totalReactions || 0,
          isLiked: false,
          replies: []
        };

        // Update posts state with new reply
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: addReplyToTree(post.comments, parentCommentId, newReply),
              totalComments: (post.totalComments ?? post.comments.length) + 1
            };
          }
          return post;
        }));

        // Also update selectedPost if it's the same post (for modal)
        if (selectedPost?.id === postId) {
          setSelectedPost(prev => {
            if (!prev) return null;
            return {
              ...prev,
              comments: addReplyToTree(prev.comments, parentCommentId, newReply),
              totalComments: (prev.totalComments ?? prev.comments.length) + 1
            };
          });
        }

        // Clear reply input
        setReplyInputs(prev => ({ ...prev, [parentCommentId]: '' }));
        setReplyingToComment(null);

        toast.success('Đã gửi trả lời');
      } else {
        throw new Error(result.message || 'Failed to submit reply');
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi gửi trả lời');
    }
  };

  // Helper function to add reply to comment tree
  const addReplyToTree = (comments: Comment[], parentId: string, newReply: Comment): Comment[] => {
    return comments.map(comment => {
      if (comment.id === parentId) {
        return {
          ...comment,
          replies: [...(comment.replies || []), newReply]
        };
      }
      if (comment.replies && comment.replies.length > 0) {
        return {
          ...comment,
          replies: addReplyToTree(comment.replies, parentId, newReply)
        };
      }
      return comment;
    });
  };

  // Wrapper for handleLike to match PostCard's onLikeComment signature
  const handleLikeComment = (commentId: string, postId: string) => {
    handleLike(commentId, 'comment', postId);
  };

  const handleDeletePost = (postId: string) => {

    // Find the post to check ownership
    const postToDelete = posts.find(post => post.id === postId);

    if (!postToDelete) {
      toast.error('Bài viết không tồn tại!');
      setShowPostMenu(null);
      return;
    }


    // Check if user is logged in
    if (!isAuthenticated || !token) {
      toast.error('Bạn cần đăng nhập để thực hiện hành động này!');
      setShowPostMenu(null);
      return;
    }

    // Check if the current user is the author of the post
    if (!isCurrentUserPost(postToDelete.gpMemberId)) {
      toast.error('Bạn chỉ có thể xóa bài viết của chính mình!');
      setShowPostMenu(null);
      return;
    }

    // Confirm deletion
    const confirmMessage = `Bạn có chắc chắn muốn xóa bài viết này?\n\nNội dung: "${postToDelete.content.substring(0, 50)}${postToDelete.content.length > 50 ? '...' : ''}"\n\nHành động này không thể hoàn tác.`;

    showConfirm(
      'Xóa bài viết',
      confirmMessage,
      async () => {
        // Show skeleton while deleting
        setDeletingPostIds(prev => {
          const next = new Set(prev);
          next.add(postId);
          return next;
        });
        try {
          // Call API to delete the post
          const result = await postService.deletePost(postId);


          if (result.status && result.data) {
            // Remove the post from the posts array
            setPosts(prev => prev.filter(post => post.id !== postId));

            // Also close the post detail modal if it's showing the deleted post
            if (selectedPost?.id === postId) {
              setShowPostDetail(false);
              setSelectedPost(null);
            }

            toast.success('Bài viết đã được xóa thành công!');
          } else {
            throw new Error(result.message || 'Không thể xóa bài viết');
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Có lỗi xảy ra khi xóa bài viết';
          toast.error(errorMessage);
        } finally {
          // Remove skeleton state
          setDeletingPostIds(prev => {
            const next = new Set(prev);
            next.delete(postId);
            return next;
          });
        }
      },
      {
        confirmText: 'Xóa',
        cancelText: 'Hủy',
        confirmButtonClass: 'bg-red-600 hover:bg-red-700',
        onCancel: () => {
        }
      }
    );
    setShowPostMenu(null);
  };


  const handleReportPost = (postId: string) => {
    setReportingPostId(postId);
    setShowReportPostModal(true);
    setShowPostMenu(null);
  };

  const handleSubmitPostReport = () => {
    if (postReportReason.trim()) {
      // TODO: Submit report to backend
      toast.success('Báo cáo bài viết đã được gửi thành công!');
      setShowReportPostModal(false);
      setPostReportReason('');
      setReportingPostId(null);
    }
  };

  const handleSearchPosts = () => {
    if (searchQuery.trim()) {
      setSearchLoading(true);
      
      // Simulate API call delay (remove this in production if API exists)
      setTimeout(() => {
        const filteredPosts = posts.filter(post =>
          post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          post.author.name.toLowerCase().includes(searchQuery.toLowerCase())
        );
        
        setSearchResults(filteredPosts);
        setIsSearchActive(true);
        setSearchLoading(false);
        setShowSearchPopup(false);
        
      }, 500);
    }
  };

  // Function to clear search and show all posts
  const handleClearSearch = () => {
    setSearchResults([]);
    setIsSearchActive(false);
    setSearchQuery('');
  };

  const handleOpenPostDetail = (post: Post) => {
    setSelectedPost(post);
    setShowPostDetail(true);
    // Comments will be loaded automatically by PostDetailPage component
  };

  // Helper function to get current user's name
  const getCurrentUserName = (): string => {
    return userData.name || user?.name || 'Username';
  };

  const isCurrentUserPost = (postGpMemberId: string) => {
    return gpMemberId === postGpMemberId;
  };

  // Simple wrapper for CommentItem to work with PostDetailPage
  const SimpleCommentItem: React.FC<{
    comment: Comment;
    postId: string;
    depth?: number;
    maxDepth?: number;
  }> = ({ comment, postId, depth = 0, maxDepth = 1 }) => ( // Only allow 2 levels: comments and replies
    <CommentItem
      comment={comment}
      postId={postId}
      depth={depth}
      maxDepth={maxDepth}
      currentUserGPMemberId={gpMemberId ?? ''}
      userData={userData}
      editingCommentId={editingCommentId}
      editCommentContent={editCommentContent}
      setEditingCommentId={setEditingCommentId}
      setEditCommentContent={setEditCommentContent}
      onEditComment={handleEditComment}
      onDeleteComment={handleDeleteComment}
      onReportComment={handleReportComment}
      onLikeComment={handleLikeComment}
      replyingToComment={replyingToComment}
      setReplyingToComment={setReplyingToComment}
      replyInputs={replyInputs}
      setReplyInputs={setReplyInputs}
      onReplySubmit={handleReplySubmit}
      collapsedReplies={collapsedReplies}
      setCollapsedReplies={setCollapsedReplies}
      showCommentMenu={showCommentMenu}
      setShowCommentMenu={setShowCommentMenu}
    />
  );

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="h-full">
        {/* Group Banner */}
        <div className="relative">
          {/* Group Info */}
          <div className="bg-white border-b border-gray-200 px-4 shadow-sm">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-end justify-between pb-6 mt-4">
                <div className="flex items-end space-x-6">
                  {/* Group Avatar/Logo */}
                  {familyTreeData?.picture && familyTreeData.picture !== 'string1' && (
                    <div className="relative -mt-16 mb-2">
                      <div className="w-32 h-32 rounded-2xl border-4 border-white shadow-xl overflow-hidden bg-white">
                        <img
                          src={familyTreeData.picture}
                          alt={familyTreeData.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = defaultPicture;
                          }}
                        />
                      </div>
                      {familyTreeData.isActive && (
                        <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-green-500 border-4 border-white rounded-full flex items-center justify-center">
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Group Details */}
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <h1 className="text-4xl font-bold text-gray-900">
                        {familyTreeLoading ? (
                          <div className="h-10 bg-gray-200 rounded animate-pulse w-64"></div>
                        ) : (
                          familyTreeData?.name || 'Gia Phả Gia Đình'
                        )}
                      </h1>
                    </div>
                    
                    {/* Description */}
                    {familyTreeData?.description && familyTreeData.description !== 'string1' && (
                      <p className="text-gray-600 mb-3 max-w-2xl line-clamp-2">
                        {familyTreeData.description}
                      </p>
                    )}
                    
                    <div className="flex items-center space-x-6 text-gray-600">
                      {/* Members Count */}
                      <div className="flex items-center space-x-2">
                        {familyTreeLoading ? (
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-24"></div>
                        ) : (
                          <>
                            <Users className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-semibold text-gray-900">
                              {familyTreeData?.numberOfMember || 0}
                            </span>
                            <span className="text-sm">thành viên</span>
                          </>
                        )}
                      </div>
                      
                      {/* Owner Info */}
                      {familyTreeData?.owner && (
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                          </svg>
                          <span className="text-sm">
                            <span className="text-gray-500">Quản lý bởi</span>{' '}
                            <span className="font-semibold text-gray-900">{familyTreeData.owner}</span>
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 pb-2">
                  <button
                    onClick={() => setShowSharePopup(true)}
                    className="flex items-center space-x-2 px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-all duration-200 font-medium"
                    title="Chia sẻ gia phả"
                  >
                    <Share className="w-4 h-4" />
                    <span>Chia sẻ</span>
                  </button>
                  <button
                    onClick={() => setShowSearchPopup(true)}
                    className="flex items-center justify-center p-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                    title="Tìm kiếm bài viết"
                  >
                    <Search className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-4 sm:px-6 lg:px-8 py-6">

          <div className="flex justify-center">
            <div className="w-full max-w-4xl flex gap-7 lg:gap-10">
              {/* Main Content */}
              <div className="flex-1 max-w-none lg:max-w-3xl space-y-8">
                {/* Simple Post Input - Opens Modal */}
                <div className="bg-white shadow-sm rounded-lg border border-gray-200">
                  <div className="p-4">
                    {/* GPMember Status Indicator */}
                    {(gpMemberLoading || gpMemberError) && (
                      <div className="mb-3 p-2 rounded-lg text-sm">
                        {gpMemberLoading && (
                          <div className="flex items-center space-x-2 text-blue-600">
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                            <span>Đang tải thông tin thành viên gia phả...</span>
                          </div>
                        )}
                        {gpMemberError && (
                          <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-2 rounded">
                            <X className="w-4 h-4" />
                            <span>{gpMemberError}</span>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex items-center space-x-3">
                      {getAvatarFromGPMember(_gpMember) || userData.picture ? (
                        <img
                          src={getAvatarFromGPMember(_gpMember) || userData.picture || defaultPicture}
                          alt={getDisplayNameFromGPMember(_gpMember) || 'Your avatar'}
                          className="w-10 h-10 rounded-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = defaultPicture;
                          }}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User size={20} className="text-gray-500" />
                        </div>
                      )}
                      <button
                        onClick={() => setShowCreatePostModal(true)}
                        className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 rounded-full text-left text-gray-500 transition-colors cursor-pointer"
                        disabled={gpMemberLoading || !!gpMemberError}
                      >
                        {gpMemberLoading ? 'Đang tải...' : gpMemberError ? 'Không thể tạo bài viết' : 'Bạn đang nghĩ gì?'}
                      </button>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center justify-around mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => setShowCreatePostModal(true)}
                        disabled={gpMemberLoading || !!gpMemberError || !gpMemberId}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors text-green-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <Image className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-sm font-medium">Ảnh/video</span>
                      </button>

                      <button
                        onClick={() => setShowEventModal(true)}
                        disabled={gpMemberLoading || !!gpMemberError || !gpMemberId}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Tạo sự kiện và chia sẻ"
                      >
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm">📍</span>
                        </div>
                        <span className="text-sm font-medium">Sự kiện</span>
                      </button>

                      <button
                        // onClick={() => setShowCreatePostModal(true)}
                        disabled={gpMemberLoading || !!gpMemberError || !gpMemberId}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors text-yellow-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="w-6 h-6 bg-yellow-100 rounded-full flex items-center justify-center">
                          <span className="text-yellow-600 text-sm">🪙</span>
                        </div>
                        <span className="text-sm font-medium">Gây quỹ</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Loading State */}
                {initialLoading ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="animate-pulse">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                      <div className="h-32 bg-gray-200 rounded mt-4"></div>
                    </div>
                  </div>
                ) : null}

                {/* Error State */}
                {error && !initialLoading ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="text-center">
                      <div className="text-red-500 mb-2">
                        <X className="w-12 h-12 mx-auto" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Không thể tải bài viết</h3>
                      <p className="text-gray-600 mb-4">{error}</p>
                      <div className="space-x-3">
                        <button
                          onClick={() => {
                            setError(null);
                            loadPosts();
                          }}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          Thử lại
                        </button>
                        <button
                          onClick={() => window.location.reload()}
                          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          Tải lại trang
                        </button>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* Empty State */}
                {!initialLoading && !error && posts.length === 0 ? (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    <div className="text-center">
                      <MessageCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Chưa có bài viết nào</h3>
                      <p className="text-gray-600 mb-4">Hãy là người đầu tiên chia sẻ câu chuyện của gia đình!</p>
                      <button
                        onClick={() => setShowCreatePostModal(true)}
                        disabled={gpMemberLoading || !!gpMemberError || !gpMemberId}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {gpMemberLoading ? 'Đang tải...' : gpMemberError ? 'Không thể tạo bài viết' : 'Tạo bài viết đầu tiên'}
                      </button>
                    </div>
                  </div>
                ) : null}

                {/* Search Results Header */}
                {isSearchActive && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Kết quả tìm kiếm cho "{searchQuery}"
                        </h3>
                        <p className="text-sm text-gray-600">
                          Tìm thấy {searchResults.length} bài viết
                        </p>
                      </div>
                      <button
                        onClick={handleClearSearch}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <X className="w-4 h-4" />
                        <span>Xóa tìm kiếm</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Search Loading State */}
                {searchLoading && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="animate-pulse">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                        <div className="space-y-2 flex-1">
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                          <div className="h-3 bg-gray-200 rounded w-1/6"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded"></div>
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Search Empty State */}
                {isSearchActive && !searchLoading && searchResults.length === 0 && (
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
                    <div className="text-center">
                      <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Không tìm thấy bài viết nào</h3>
                      <p className="text-gray-600 mb-4">
                        Không có bài viết nào chứa từ khóa "{searchQuery}". Thử tìm kiếm với từ khóa khác.
                      </p>
                      <button
                        onClick={handleClearSearch}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Xem tất cả bài viết
                      </button>
                    </div>
                  </div>
                )}

                {/* Posts Feed */}
                {!initialLoading && !error && !searchLoading && (isSearchActive ? searchResults : posts).length > 0 && (isSearchActive ? searchResults : posts).map((post) => (
                  deletingPostIds.has(post.id) ? (
                    <div key={post.id} className="bg-white shadow-sm rounded-lg border border-gray-200 p-6 animate-pulse">
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gray-200" />
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                          <div className="h-3 bg-gray-100 rounded w-1/4" />
                        </div>
                      </div>
                      <div className="h-4 bg-gray-100 rounded w-5/6 mb-2" />
                      <div className="h-4 bg-gray-100 rounded w-2/3 mb-4" />
                      <div className="w-full aspect-square bg-gray-100 rounded" />
                    </div>
                  ) : (
                  <PostCard
                    key={post.id}
                    post={post}
                    currentUserGPMemberId={gpMemberId ?? ''}
                    userData={userData}
                    reactionTypes={reactionTypes}
                    
                    editingPostId={editingPostId}
                    editContent={editContent}
                    editTitle={editTitle}
                    editStatus={editStatus}
                    editImages={editImages}
                    editImagePreviews={editImagePreviews}
                    editCaptions={editCaptions}
                    existingImages={existingImages}
                    isUpdatingPost={isUpdatingPost}
                    
                    setEditContent={setEditContent}
                    setEditTitle={setEditTitle}
                    setEditStatus={setEditStatus}
                    
                    showPostMenu={showPostMenu}
                    setShowPostMenu={setShowPostMenu}
                    showReactionPicker={showReactionPicker}
                    setShowReactionPicker={setShowReactionPicker}
                    hoveredPost={hoveredPost}
                    setHoveredPost={setHoveredPost}
                    
                    tooltipShowTime={tooltipShowTime}
                    isHoveringReactionPicker={isHoveringReactionPicker}
                    
                    onEditPost={handleEditPost}
                    onDeletePost={handleDeletePost}
                    onReportPost={handleReportPost}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
                    onReaction={handleReaction}
                    onReactionSummaryClick={handleReactionSummaryClick}
                    onOpenPostDetail={handleOpenPostDetail}
                    
                    onEditImageSelect={handleEditImageSelect}
                    onRemoveEditImage={removeEditImage}
                    onRemoveExistingImage={removeExistingImage}
                    onUpdateEditCaption={updateEditCaption}
                    
                    getReactionSummaryText={getReactionSummaryText}
                    isCurrentUserPost={isCurrentUserPost}
                    
                    // Comment features - pass through for inline display
                    showComments={false}
                    commentInputs={commentInputs}
                    setCommentInputs={setCommentInputs}
                    onCommentSubmit={handleCommentSubmit}
                    onLikeComment={handleLikeComment}
                    onEditComment={handleEditComment}
                    onDeleteComment={handleDeleteComment}
                    onReportComment={handleReportComment}
                    onReplySubmit={handleReplySubmit}
                    
                    showCommentMenu={showCommentMenu}
                    setShowCommentMenu={setShowCommentMenu}
                    editingCommentId={editingCommentId}
                    setEditingCommentId={setEditingCommentId}
                    editCommentContent={editCommentContent}
                    setEditCommentContent={setEditCommentContent}
                    replyingToComment={replyingToComment}
                    setReplyingToComment={setReplyingToComment}
                    replyInputs={replyInputs}
                    setReplyInputs={setReplyInputs}
                    collapsedReplies={collapsedReplies}
                    setCollapsedReplies={setCollapsedReplies}
                  />
                  )
                ))}
              </div>

              {/* Right Sidebar */}
              <div className="w-72 space-y-3 hidden lg:block">
                {/* Family Tree Statistics */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-white text-sm">Hoạt động gia phả</h3>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Tổng bài viết</p>
                          <p className="text-xl font-bold text-gray-900">{posts.length}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 bg-green-100 rounded-lg flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Tổng bình luận</p>
                          <p className="text-xl font-bold text-gray-900">
                            {posts.reduce((sum, post) => sum + post.comments.length, 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2.5">
                        <div className="w-9 h-9 bg-pink-100 rounded-lg flex items-center justify-center">
                          <ThumbsUp className="w-4 h-4 text-pink-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Tổng phản ứng</p>
                          <p className="text-xl font-bold text-gray-900">
                            {posts.reduce((sum, post) => sum + (post.totalReactions || 0), 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Most Active Members */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                      <span>Thành viên tích cực</span>
                    </h3>
                  </div>
                  <div className="p-4">
                    {(() => {
                      // Calculate post counts by author
                      const authorCounts = posts.reduce((acc: { [key: string]: { name: string, avatar: string, count: number } }, post) => {
                        const authorId = post.gpMemberId || post.author.name;
                        if (!acc[authorId]) {
                          acc[authorId] = {
                            name: post.author.name,
                            avatar: post.author.avatar,
                            count: 0
                          };
                        }
                        acc[authorId].count++;
                        return acc;
                      }, {});
                      
                      // Get top 5 authors, keep their ids for GP mapping
                      const topAuthors = Object.entries(authorCounts)
                        .map(([id, data]) => ({ id, ...data }))
                        .sort((a, b) => b.count - a.count)
                        .slice(0, 5);
                      
                      const rankColors = [
                        'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white',
                        'bg-gradient-to-br from-gray-300 to-gray-500 text-white',
                        'bg-gradient-to-br from-orange-400 to-orange-600 text-white',
                        'bg-blue-100 text-blue-600',
                        'bg-purple-100 text-purple-600'
                      ];
                      
                      return topAuthors.length > 0 ? (
                        <div className="space-y-2">
                          {topAuthors.map((author, index) => {
                            const profile = gpMemberMap[author.id];
                            const displayName = profile ? (getDisplayNameFromGPMember(profile) || author.name) : author.name;
                            const displayAvatar = profile ? (getAvatarFromGPMember(profile) || author.avatar) : author.avatar;
                            return (
                            <div key={index} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group">
                              <div className="relative">
                                <img
                                  src={displayAvatar || defaultPicture}
                                  alt={displayName}
                                  className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = defaultPicture;
                                  }}
                                />
                                <div className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-lg ${rankColors[index]}`}>
                                  {index + 1}
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate">{displayName}</p>
                                <p className="text-xs text-gray-500 flex items-center space-x-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                  </svg>
                                  <span>{author.count} bài viết</span>
                                </p>
                              </div>
                            </div>
                          )})}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-8">Chưa có dữ liệu</p>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Popup */}
          {showSearchPopup && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-lg w-full">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Tìm kiếm bài viết</h2>
                    <button
                      onClick={() => setShowSearchPopup(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {/* Search Input */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Từ khóa tìm kiếm
                      </label>
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Nhập nội dung bài viết, tiêu đề hoặc tên tác giả..."
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            handleSearchPosts();
                          }
                        }}
                      />
                    </div>

                    {/* Search Criteria */}
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">Tìm kiếm trong:</h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span>Nội dung bài viết</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span>Tiêu đề bài viết</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span>Tên tác giả</span>
                        </div>
                      </div>
                    </div>

                    {/* Current Total Posts */}
                    <div className="text-sm text-gray-500 text-center">
                      Tổng cộng {posts.length} bài viết trong nhóm
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          setShowSearchPopup(false);
                          setSearchQuery('');
                        }}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleSearchPosts}
                        disabled={!searchQuery.trim()}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
                      >
                        <div className="flex items-center space-x-2">
                          <Search className="w-4 h-4" />
                          <span>Tìm kiếm</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Share Popup */}
          {showSharePopup && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Chia sẻ gia phả</h2>
                    <button
                      onClick={() => setShowSharePopup(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <img
                          src={familyTreeData?.picture || "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=60&h=60&fit=crop"}
                          alt="Group"
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {familyTreeData?.name || 'Gia Phả Gia Đình'}
                          </h3>
                          <p className="text-sm text-gray-600">
                            Nhóm công khai • {familyTreeData?.numberOfMember || 0} thành viên
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 bg-white rounded-lg p-3 border">
                        <span className="flex-1 text-sm text-gray-600 truncate">
                          {window.location.origin}/group/{familyTreeId || '822994d5-7acd-41f8-b12b-e0a634d74440'}
                        </span>
                        <button
                          onClick={handleCopyLink}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                        >
                          Sao chép
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Report Comment Modal */}
          {showReportModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Báo cáo bình luận</h2>
                    <button
                      onClick={() => setShowReportModal(false)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Lý do báo cáo
                      </label>
                      <select
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Chọn lý do</option>
                        <option value="spam">Spam</option>
                        <option value="harassment">Quấy rối</option>
                        <option value="inappropriate">Nội dung không phù hợp</option>
                        <option value="false-info">Thông tin sai lệch</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                    {reportReason === 'other' && (
                      <textarea
                        placeholder="Mô tả chi tiết..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={3}
                      />
                    )}
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => {
                          setShowReportModal(false);
                          setReportReason('');
                        }}
                        className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                      >
                        Hủy
                      </button>
                      <button
                        onClick={handleSubmitReport}
                        disabled={!reportReason}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg"
                      >
                        Gửi báo cáo
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Post Action Modal (Edit or Report) */}
          {showReportPostModal && reportingPostId && (() => {
            const reportingPost = posts.find(p => p.id === reportingPostId);
            const isOwnPost = reportingPost ? isCurrentUserPost(reportingPost.gpMemberId) : false;
            
            return (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-xl font-bold text-gray-900">
                        {isOwnPost ? 'Tùy chọn bài viết' : 'Báo cáo bài viết'}
                      </h2>
                      <button
                        onClick={() => setShowReportPostModal(false)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-6 h-6" />
                      </button>
                    </div>

                    {isOwnPost ? (
                      /* Edit options for own post */
                      <div className="space-y-3">
                        <button
                          onClick={() => {
                            if (reportingPost) {
                              handleEditPost(reportingPost.id, reportingPost.content, reportingPost.title);
                            }
                            setShowReportPostModal(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-gray-100 rounded-lg flex items-center space-x-3 transition-colors"
                        >
                          <Edit className="w-5 h-5 text-blue-600" />
                          <div>
                            <div className="font-medium text-gray-900">Chỉnh sửa bài viết</div>
                            <div className="text-sm text-gray-500">Thay đổi nội dung hoặc ảnh</div>
                          </div>
                        </button>
                        
                        <button
                          onClick={() => {
                            if (reportingPost) {
                              handleDeletePost(reportingPost.id);
                            }
                            setShowReportPostModal(false);
                          }}
                          className="w-full px-4 py-3 text-left hover:bg-red-50 rounded-lg flex items-center space-x-3 transition-colors"
                        >
                          <Trash2 className="w-5 h-5 text-red-600" />
                          <div>
                            <div className="font-medium text-red-600">Xóa bài viết</div>
                            <div className="text-sm text-gray-500">Xóa bài viết vĩnh viễn</div>
                          </div>
                        </button>
                      </div>
                    ) : (
                      /* Report options for others' posts */
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Lý do báo cáo
                          </label>
                          <select
                            value={postReportReason}
                            onChange={(e) => setPostReportReason(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Chọn lý do</option>
                            <option value="spam">Spam</option>
                            <option value="harassment">Quấy rối</option>
                            <option value="inappropriate">Nội dung không phù hợp</option>
                            <option value="false-info">Thông tin sai lệch</option>
                            <option value="violence">Bạo lực</option>
                            <option value="hate-speech">Ngôn từ căm thù</option>
                            <option value="other">Khác</option>
                          </select>
                        </div>
                        {postReportReason === 'other' && (
                          <textarea
                            placeholder="Mô tả chi tiết..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                          />
                        )}
                        <div className="flex justify-end space-x-3">
                          <button
                            onClick={() => {
                              setShowReportPostModal(false);
                              setPostReportReason('');
                            }}
                            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                          >
                            Hủy
                          </button>
                          <button
                            onClick={handleSubmitPostReport}
                            disabled={!postReportReason}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white rounded-lg"
                          >
                            Gửi báo cáo
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Create Post Modal */}
          {showCreatePostModal && (
            <div 
              className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
              onClick={handleCloseCreatePostModal}
            >
              <div 
                className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Modal Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">Tạo bài viết</h2>
                  <button
                    onClick={handleCloseCreatePostModal}
                    className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100 transition-colors"
                    type="button"
                    aria-label="Đóng"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* User Info */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                    {userData.picture ? (
                      <img 
                        src={getAvatarFromGPMember(_gpMember) || userData.picture || defaultPicture} 
                        alt={getDisplayNameFromGPMember(_gpMember) || userData?.name || 'User'} 
                        className="w-10 h-10 rounded-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = defaultPicture;
                        }}
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <User size={20} className="text-gray-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">
                        {getDisplayNameFromGPMember(_gpMember) || userData?.name || 'User'}
                      </p>
                    </div>
                    </div>
                    <button
                      onClick={() => setCreateStatus(prev => prev === 1 ? 0 : 1)}
                      className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
                      type="button"
                    >
                      {createStatus === 1 ? (
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

                {/* Post Content */}
                <div className="p-4">
                  {/* Title Input */}
                  <input
                    type="text"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="Tiêu đề bài viết (tùy chọn)"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-3"
                  />
                  
                  {/* Content Input */}
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Bạn đang nghĩ gì?"
                    className="w-full p-3 resize-none border-none focus:outline-none text-lg"
                    rows={4}
                    style={{ minHeight: '120px' }}
                  />

                  {/* Image Previews with Captions */}
                  {imagePreviews.length > 0 && (
                    <div className="mt-4 border border-gray-200 rounded-lg p-4">
                      <div className="space-y-4">
                        {imagePreviews.map((preview, index) => (
                          <div key={index} className="space-y-2">
                            <div className="relative">
                              {selectedImages[index]?.type.startsWith('video/') ? (
                                <video
                                  src={preview}
                                  className="w-full h-32 object-cover rounded-lg"
                                  controls
                                />
                              ) : (
                                <img
                                  src={preview}
                                  alt={`Preview ${index + 1}`}
                                  className="w-full h-32 object-cover rounded-lg"
                                />
                              )}
                              <button
                                onClick={() => removeImage(index)}
                                className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                            {/* Caption Input */}
                            <input
                              type="text"
                              value={fileCaptions[index] || ''}
                              onChange={(e) => updateFileCaption(index, e.target.value)}
                              placeholder={`Mô tả cho ${selectedImages[index]?.type.startsWith('video/') ? 'video' : 'ảnh'} ${index + 1}...`}
                              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add to Post Options */}
                  <div className="mt-4 p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">Thêm vào bài viết của bạn</span>
                      <div className="flex items-center space-x-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-8 h-8 bg-green-100 hover:bg-green-200 rounded-full flex items-center justify-center transition-colors"
                          title="Thêm ảnh/video"
                        >
                          <Image className="w-4 h-4 text-green-600" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={handleCreatePost}
                    disabled={isPosting || (!postContent.trim() && selectedImages.length === 0)}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white font-semibold rounded-lg transition-colors"
                  >
                    {isPosting ? 'Đang đăng...' : 'Đăng'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reaction Popup Modal */}
          {showReactionPopup && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 bg-opacity-50">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
                {/* Modal Header */}
                <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Phản ứng</h3>
                  <button
                    onClick={() => setShowReactionPopup(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Modal Body */}
                <div className="p-4 max-h-96 overflow-y-auto">
                  {showReactionPopup && posts.find(p => p.id === showReactionPopup) && (
                    <div className="space-y-3">
                      {Object.entries(posts.find(p => p.id === showReactionPopup)!.reactionsSummary)
                        .sort((a, b) => b[1] - a[1])
                        .map(([type, count]) => {
                          const reactionData = reactionTypes.find(r => r.type.toLowerCase() === type.toLowerCase());
                          const emoji = reactionData?.emoji || '👍';
                          const label = reactionData?.label || type;
                          
                          return (
                            <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-3">
                                <span className="text-2xl">{emoji}</span>
                                <div>
                                  <span className="font-medium text-gray-900">{label}</span>
                                </div>
                              </div>
                              <span className="text-lg font-semibold text-blue-600">{count}</span>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowReactionPopup(null)}
                    className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </div>
            </div>
          )}

        {/* Confirm Dialog */}
        {showConfirmDialog && confirmDialogData && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black bg-opacity-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
              {/* Header */}
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900">{confirmDialogData.title}</h3>
              </div>

              {/* Body */}
              <div className="px-6 py-6">
                <p className="text-gray-700 whitespace-pre-line leading-relaxed">{confirmDialogData.message}</p>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 rounded-b-xl flex items-center justify-end space-x-3">
                <button
                  onClick={confirmDialogData.onCancel}
                  className="px-5 py-2.5 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium transition-colors"
                >
                  {confirmDialogData.cancelText}
                </button>
                <button
                  onClick={confirmDialogData.onConfirm}
                  className={`px-5 py-2.5 text-white rounded-lg font-medium transition-all transform hover:scale-105 ${confirmDialogData.confirmButtonClass}`}
                >
                  {confirmDialogData.confirmText}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Post Detail Modal */}
        <PostDetailPage
          isOpen={showPostDetail}
          post={selectedPost as any}
          onClose={() => setShowPostDetail(false)}
          commentInputs={commentInputs}
          setCommentInputs={setCommentInputs}
          onLikePost={handleLike}
          onCommentSubmit={handleCommentSubmit}
          onEditPost={handleModalEditPost}
          onUpdateComments={(postId, comments) => {
            // Update both posts and selectedPost with new comments
            setPosts(prev => prev.map(p =>
              p.id === postId ? { ...p, comments } : p
            ));
            if (selectedPost?.id === postId) {
              setSelectedPost(prev => prev ? { ...prev, comments } : null);
            }
          }}
          reactionTypes={reactionTypes}
          showReactionPicker={showReactionPicker}
          setShowReactionPicker={setShowReactionPicker}
          onReaction={handleReaction}
          hoveredPost={hoveredPost}
          setHoveredPost={setHoveredPost}
          tooltipShowTime={tooltipShowTime}
          isHoveringReactionPicker={isHoveringReactionPicker}
          getReactionSummaryText={getReactionSummaryText}
          onReactionSummaryClick={handleReactionSummaryClick}
          CommentItem={SimpleCommentItem}
        />

        {/* Event Creation Modal */}
        <GPEventDetailsModal
          isOpenModal={showEventModal}
          setIsOpenModal={setShowEventModal}
          handleCreatedEvent={handleEventCreated}
        />
      </div>
    </div>
  );
};

export default PostPage;