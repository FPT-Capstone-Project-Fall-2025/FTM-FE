import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import defaultPicture from '@/assets/dashboard/default-avatar.png';
import { MessageCircle, MoreHorizontal, Send, Image, Smile, X, ThumbsUp, Search, Edit, Trash2, Flag, Users, User, Eye, Settings, Share, Plus, Lock, Globe, Save, Camera, XCircle } from 'lucide-react';
import PostDetailPage from './PostDetailPage';
import postService, { type PostData, type CreatePostData } from '@/services/postService';
import familyTreeService from '@/services/familyTreeService';
import { getUserIdFromToken, getFullNameFromToken } from '@/utils/jwtUtils';
import userService from '@/services/userService';
import { useGPMember, useGPMemberId } from '@/hooks/useGPMember';
import { toast } from 'react-toastify';

interface Post {
  id: string;
  title?: string;
  gpMemberId: string;
  author: {
    name: string;
    avatar: string;
    timeAgo: string;
  };
  content: string;
  images?: string[];
  likes: number;
  comments: Comment[];
  isLiked: boolean;
  isEdited?: boolean;
  editedAt?: string;
  totalReactions: number;
  reactionsSummary: { [key: string]: number };
  userReaction?: string | null;
  userReactionId?: string | null; // ID of the user's reaction for deletion
}

interface Comment {
  id: string;
  gpMemberId?: string;
  author?: {
    name: string;
    avatar: string;
  };
  content: string;
  images?: string[];
  timeAgo: string;
  likes: number;
  isLiked: boolean;
  isEdited?: boolean;
  editedAt?: string;
  replies?: Comment[];
}

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
  const [commentImagePreviews, setCommentImagePreviews] = useState<{ [key: string]: string[] }>({});
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
  
  // Family tree details state
  const [familyTreeData, setFamilyTreeData] = useState<any>(null);
  const [familyTreeLoading, setFamilyTreeLoading] = useState(false);
  
  // User data state (similar to Navigation.tsx)
  const [userData, setUserData] = useState({ name: '', picture: '' });
  const [searchQuery, setSearchQuery] = useState('');

  // GPMember integration - Get GPMemberId for the current user in this family tree
  const currentUserId = getUserIdFromToken(token || '') || user?.userId;
  const currentFamilyTreeId = familyTreeId || '822994d5-7acd-41f8-b12b-e0a634d74440';
  
  const { 
    gpMemberId, 
    gpMember, 
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

  // Comment editing states
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editCommentContent, setEditCommentContent] = useState('');

  // Reaction states
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);
  const [hoveredPost, setHoveredPost] = useState<string | null>(null);
  const [postReactions, setPostReactions] = useState<{ [postId: string]: any[] }>({});
  const [showReactionPopup, setShowReactionPopup] = useState<string | null>(null);
  const [reactionSummaryData, setReactionSummaryData] = useState<{ [postId: string]: { [key: string]: number } }>({});

  // Search states
  const [searchResults, setSearchResults] = useState<Post[]>([]);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  // Reaction types with numeric IDs for API
  const reactionTypes = [
    { type: 'Like', id: 1, emoji: '👍', label: 'Thích' },
    { type: 'Love', id: 2, emoji: '❤️', label: 'Yêu thích' },
    { type: 'Haha', id: 3, emoji: '😆', label: 'Haha' },
    { type: 'Wow', id: 4, emoji: '😮', label: 'Wow' },
    { type: 'Sad', id: 5, emoji: '😢', label: 'Buồn' },
    { type: 'Angry', id: 6, emoji: '😠', label: 'Giận dữ' }
  ];

  // Function to transform API comment to Comment interface
  const transformApiComment = (apiComment: any): Comment => {
    return {
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
      isEdited: apiComment.isEdited || false,
      editedAt: apiComment.lastModifiedOn ? formatTimeAgo(apiComment.lastModifiedOn) : undefined,
      replies: apiComment.childComments ? apiComment.childComments.map(transformApiComment) : []
    };
  };

  // Function to load comments for a specific post
  const loadCommentsForPost = async (postId: string): Promise<Comment[]> => {
    try {
      const result = await postService.getComments(postId);
      
      // Handle both API response formats
      const success = result.success || result.status || (result.statusCode === 200);
      const data = result.data;
      
      if (success && data) {
        // Transform API comment data to match Comment interface
        return data.map(transformApiComment);
      }
      return [];
    } catch (error) {
      console.error(`Error loading comments for post ${postId}:`, error);
      return [];
    }
  };

  // Function to refresh comments for a specific post
  const refreshCommentsForPost = async (postId: string) => {
    try {
      const comments = await loadCommentsForPost(postId);
      setPosts(prev => prev.map(post =>
        post.id === postId
          ? { ...post, comments }
          : post
      ));
    } catch (error) {
      console.error(`Error refreshing comments for post ${postId}:`, error);
    }
  };

  // Function to load replies for a specific comment
  const loadRepliesForComment = async (commentId: string): Promise<Comment[]> => {
    try {
      const result = await postService.getCommentReplies(commentId);
      if (result.success && result.data) {
        return result.data.map(transformApiComment);
      }
      return [];
    } catch (error) {
      console.error(`Error loading replies for comment ${commentId}:`, error);
      return [];
    }
  };

  // Function to refresh replies for a specific comment (useful for "Load more replies" functionality)
  const refreshRepliesForComment = async (postId: string, commentId: string) => {
    try {
      const replies = await loadRepliesForComment(commentId);
      setPosts(prev => prev.map(post => {
        if (post.id === postId) {
          return {
            ...post,
            comments: post.comments.map(comment => {
              if (comment.id === commentId) {
                return { ...comment, replies };
              }
              return comment;
            })
          };
        }
        return post;
      }));
    } catch (error) {
      console.error(`Error refreshing replies for comment ${commentId}:`, error);
    }
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
      
      console.log('Posts API response:', result);
      
      // Handle both API response formats
      const success = result.success || result.status || (result.statusCode === 200);
      const data = result.data;
      
      if (success && data) {
        // Transform API data to match Post interface
        const transformedPosts: Post[] = await Promise.all(
          data.map(async (apiPost: PostData) => {
            // Load comments for each post
            const comments = await loadCommentsForPost(apiPost.id);
            
            return {
              id: apiPost.id,
              title: apiPost.title,
              gpMemberId: apiPost.gpMemberId,
              author: {
                name: apiPost.authorName || apiPost.author?.name || apiPost.createdBy || 'Unknown User',
                avatar: apiPost.authorPicture || apiPost.author?.avatar || defaultPicture,
                timeAgo: formatTimeAgo(apiPost.createdOn || apiPost.createdAt || new Date().toISOString())
              },
              content: apiPost.content,
              images: apiPost.attachments?.map(file => file.fileUrl || file.url) || apiPost.images || apiPost.files?.map(file => file.url) || [],
              likes: apiPost.totalReactions || apiPost.likes || apiPost.likesCount || 0,
              totalReactions: apiPost.totalReactions || 0,
              reactionsSummary: apiPost.reactionsSummary || {},
              userReaction: null, // Will be loaded separately
              isLiked: apiPost.isLiked || false,
              comments: comments,
              isEdited: apiPost.lastModifiedOn !== apiPost.createdOn || apiPost.lastModifiedAt !== apiPost.createdAt,
              ...(apiPost.lastModifiedOn !== apiPost.createdOn || apiPost.lastModifiedAt !== apiPost.createdAt) && {
                editedAt: formatTimeAgo(apiPost.lastModifiedOn || apiPost.lastModifiedAt || new Date().toISOString())
              }
            };
          })
        );
        
        setPosts(transformedPosts);
        
        // Load reactions for each post
        transformedPosts.forEach(post => {
          loadPostReactions(post.id);
          loadReactionSummary(post.id);
        });
      } else {
        const errorMessage = result.message || result.errors || 'Failed to load posts';
        throw new Error(errorMessage);
      }
    } catch (error) {
      console.error('Error loading posts:', error);
      
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
      
      console.error('Detailed error:', {
        error,
        familyTreeId: currentFamilyTreeId,
        user,
        token: token ? 'Present' : 'Missing'
      });
      
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
      console.log('GPMemberId loaded successfully:', gpMemberId);
      console.log('Family Tree ID:', currentFamilyTreeId);
      console.log('User ID:', currentUserId);
    }
    if (gpMemberError) {
      console.error('GPMember error:', gpMemberError);
    }
  }, [gpMemberId, gpMemberError]);

  // Function to load reactions for a post
  const loadPostReactions = async (postId: string) => {
    try {
      const result = await postService.getPostReactions(postId);
      const success = result.success || result.status || (result.statusCode === 200);
      
      if (success && result.data) {
        setPostReactions(prev => ({ ...prev, [postId]: result.data }));
        
        // Check if current user has reacted using gpMemberId
        const userReaction = result.data.find((reaction: any) => reaction.gpMemberId === gpMemberId);
        
        // Update post with user reaction and reactionId
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { 
                ...post, 
                userReaction: userReaction?.reactionType || null,
                userReactionId: userReaction?.id || null // Store reaction ID for deletion
              }
            : post
        ));
      }
    } catch (error) {
      console.error(`Error loading reactions for post ${postId}:`, error);
    }
  };

  // Function to handle reaction click
  const handleReaction = async (postId: string, reactionType: string) => {
    try {
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

      // Find the numeric reaction ID from reactionType string
      const reactionConfig = reactionTypes.find(r => r.type === reactionType);
      if (!reactionConfig) {
        console.error('Invalid reaction type:', reactionType);
        toast.error('Loại phản ứng không hợp lệ!');
        return;
      }

      console.log('=== Reaction Action ===');
      console.log('PostID:', postId);
      console.log('GPMemberID:', gpMemberId);
      console.log('Reaction Type:', reactionType);
      console.log('Reaction ID:', reactionConfig.id);
      console.log('Current User Reaction:', post.userReaction);
      console.log('Current User Reaction ID:', post.userReactionId);
      console.log('=====================');

      // If user already has this reaction, remove it (toggle off)
      if (post.userReaction === reactionType) {
        // Use the stored reaction ID for deletion
        if (!post.userReactionId) {
          toast.error('Không tìm thấy ID phản ứng. Vui lòng thử lại!');
          return;
        }
        
        console.log('Removing reaction with ID:', post.userReactionId);
        await postService.removePostReaction(post.userReactionId);
        
        // Update local state
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            const newReactionsSummary = { ...p.reactionsSummary };
            const reactionKey = reactionType.toLowerCase();
            if (newReactionsSummary[reactionKey]) {
              newReactionsSummary[reactionKey]--;
              if (newReactionsSummary[reactionKey] === 0) {
                delete newReactionsSummary[reactionKey];
              }
            }
            
            return {
              ...p,
              userReaction: null,
              userReactionId: null,
              totalReactions: Math.max(0, p.totalReactions - 1),
              reactionsSummary: newReactionsSummary,
              isLiked: false
            };
          }
          return p;
        }));
      } else {
        // If user has a different reaction, remove it first
        if (post.userReaction && post.userReactionId) {
          console.log('Removing old reaction:', post.userReaction, 'with ID:', post.userReactionId);
          await postService.removePostReaction(post.userReactionId);
        }
        
        // Add new reaction using new API format
        console.log('Adding reaction:', {
          postId,
          gpMemberId,
          reactionType: reactionConfig.id,
          reactionTypeName: reactionType
        });
        
        const response = await postService.addPostReaction({
          postId: postId,
          gpMemberId: gpMemberId,
          reactionType: reactionConfig.id // Use numeric ID (1-6)
        });
        
        console.log('Reaction response:', response);
        
        // Extract the new reaction ID from response
        const newReactionId = response.data?.id || response.data;
        
        console.log('New reaction ID:', newReactionId);
        
        // Update local state
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            const newReactionsSummary = { ...p.reactionsSummary };
            
            // If changing from one reaction to another, adjust counts
            // (The old reaction was already deleted via API)
            if (p.userReaction) {
              const oldReactionKey = p.userReaction.toLowerCase();
              if (newReactionsSummary[oldReactionKey]) {
                newReactionsSummary[oldReactionKey]--;
                if (newReactionsSummary[oldReactionKey] === 0) {
                  delete newReactionsSummary[oldReactionKey];
                }
              }
            }
            
            // Add new reaction
            const newReactionKey = reactionType.toLowerCase();
            newReactionsSummary[newReactionKey] = (newReactionsSummary[newReactionKey] || 0) + 1;
            
            // Total reactions: only increase if user had no previous reaction
            const totalChange = p.userReaction ? 0 : 1;
            
            return {
              ...p,
              userReaction: reactionType,
              userReactionId: newReactionId, // Store the new reaction ID
              totalReactions: p.totalReactions + totalChange,
              reactionsSummary: newReactionsSummary,
              isLiked: reactionType === 'Like'
            };
          }
          return p;
        }));
      }
      
      setShowReactionPicker(null);
      
      // Reload reaction summary to get updated data
      loadReactionSummary(postId);
    } catch (error: any) {
      console.error('Error handling reaction:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi thả cảm xúc';
      toast.error(`Lỗi phản ứng: ${errorMessage}`);
      
      // Reload reactions to sync state with server
      loadPostReactions(postId);
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
        setReactionSummaryData(prev => ({ ...prev, [postId]: result.data }));
        
        // Update post with reaction summary
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, reactionsSummary: result.data }
            : post
        ));
      }
    } catch (error) {
      console.error(`Error loading reaction summary for post ${postId}:`, error);
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
          console.error('Failed to load family tree details:', result.message);
        }
      } catch (error) {
        console.error('Error loading family tree details:', error);
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
        console.log(error);
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
      
      console.log('Using GPMemberId:', gpMemberId);
      
      // Debug logging for arrays
      console.log('selectedImages length:', selectedImages.length);
      console.log('fileCaptions length:', fileCaptions.length);
      console.log('fileCaptions array:', fileCaptions);
      
      // Prepare data according to API structure
      const postData: CreatePostData = {
        GPId: currentFamilyTreeId,
        Title: postTitle.trim() || '',  // Allow empty title
        Content: postContent.trim() || '', // Ensure Content is never undefined
        GPMemberId: gpMemberId,
        Status: 1,
        Files: selectedImages.length > 0 ? selectedImages : undefined,
        Captions: selectedImages.length > 0 ? fileCaptions : undefined,
        // Temporarily disable FileTypes to test if it's causing the validation error
        // FileTypes: selectedImages.length > 0 ? selectedImages.map((file, index) => {
        //   if (file.type.startsWith('image/')) return 'Image';
        //   if (file.type.startsWith('video/')) return 'Video';
        //   return 'File';
        // }) : undefined
      };

      console.log('Creating post with data:', postData);
      console.log('User info (state):', user);
      console.log('User data (API):', userData);
      console.log('Family Tree ID:', currentFamilyTreeId);
      console.log('GPMemberId:', gpMemberId);
      console.log('Full name from JWT:', getFullNameFromToken(token!));

      const response = await postService.createPost(postData);
      
      console.log('Post creation response:', response);

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
          // Handle multiple possible URL fields for attachments
          images: data.attachments?.map((file: any) => file.fileUrl || file.url) || [],
          likes: data.totalReactions || 0,
          totalReactions: data.totalReactions || 0,
          reactionsSummary: data.reactionsSummary || {},
          userReaction: null,
          userReactionId: null,
          isLiked: false,
          comments: data.comments || []
        };

        console.log('New post created with images:', newPost.images);
        console.log('Attachments from API:', data.attachments);

        setPosts(prev => [newPost, ...prev]);
        
        // Close modal and reset form
        handleCloseCreatePostModal();
        
        toast.success('Bài viết đã được tạo thành công!');
      } else {
        console.error('Post creation failed:', response);
        throw new Error(response.message || 'Failed to create post');
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      console.error('Error response data:', error.response?.data);
      
      // More specific error messages
      let errorMessage = 'Có lỗi xảy ra khi tạo bài viết. Vui lòng thử lại!';
      
      if (error.response?.status === 400) {
        // Check for validation errors
        const validationErrors = error.response?.data?.errors;
        if (validationErrors) {
          console.error('Validation errors:', validationErrors);
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

  // Handle ESC key to close modal
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showCreatePostModal) {
        handleCloseCreatePostModal();
      }
    };

    if (showCreatePostModal) {
      document.addEventListener('keydown', handleEscKey);
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [showCreatePostModal]);

  const handleLike = (id: string, type: 'post' | 'comment', postId?: string) => {
    // Validation
    if (!id || !type) {
      console.error('handleLike: Missing required parameters', { id, type, postId });
      return;
    }

    if (type === 'comment' && !postId) {
      console.error('handleLike: postId is required for comment likes');
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

  // Legacy functions for backward compatibility
  const handleLikePost = (postId: string) => {
    handleLike(postId, 'post');
  };

  const handleLikeComment = (postId: string, commentId: string) => {
    handleLike(commentId, 'comment', postId);
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
        parentCommentId: undefined, // This is a root comment (not a reply)
      });
      
      console.log('Comment result:', result);
      
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
            ? { ...post, comments: [...post.comments, newComment] }
            : post
        ));

        // Clear comment input and images
        setCommentInputs(prev => ({ ...prev, [postId]: '' }));
        setCommentImages(prev => ({ ...prev, [postId]: [] }));
        setCommentImagePreviews(prev => ({ ...prev, [postId]: [] }));
        
        toast.success('Đã gửi bình luận');
      } else {
        throw new Error(result.message || 'Failed to submit comment');
      }
    } catch (error: any) {
      console.error('Error submitting comment:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi gửi bình luận';
      toast.error(errorMessage);
    }
  };

  // Facebook-style edit post handler
  const handleEditPost = (postId: string, content: string, title?: string) => {
    console.log('Attempting to edit post:', postId, 'by user:', getCurrentUserName());

    // Find the post to check ownership
    const postToEdit = posts.find(post => post.id === postId);

    if (!postToEdit) {
      console.error('Post not found:', postId);
      toast.error('Bài viết không tồn tại!');
      setShowPostMenu(null);
      return;
    }

    // Check if user is logged in
    if (!isAuthenticated || !token) {
      console.error('User not authenticated');
      toast.error('Bạn cần đăng nhập để thực hiện hành động này!');
      setShowPostMenu(null);
      return;
    }

    // Check if the current user is the author of the post
    if (!isCurrentUserPost(postToEdit.gpMemberId)) {
      console.warn('User attempting to edit another user\'s post');
      toast.error('Bạn chỉ có thể chỉnh sửa bài viết của chính mình!');
      setShowPostMenu(null);
      return;
    }

    console.log('Edit permission granted, opening edit mode');
    
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

    console.log('Attempting to save edit for post:', postId);
    setIsUpdatingPost(true);

    try {
      const currentFamilyTreeId = familyTreeId || '822994d5-7acd-41f8-b12b-e0a634d74440';
      
      // Prepare update data - ensure Content is never empty for API validation
      const updateData = {
        Title: editTitle.trim(),
        Content: editContent.trim() || ' ', // Ensure content is never empty string
        Status: editStatus,
        GPId: currentFamilyTreeId, // Include Family Tree ID
        GPMemberId: gpMemberId, // Include GPMemberId for ownership verification
        Files: editImages.length > 0 ? editImages : undefined,
        Captions: editImages.length > 0 ? editCaptions : undefined,
        // Skip FileTypes to avoid validation errors - let API auto-detect
        RemoveImageIds: imagesToRemove.length > 0 ? imagesToRemove : undefined
      };

      console.log('Updating post with data:', updateData);
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
      console.error('Error updating post:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
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

  // Toggle post privacy
  const togglePostPrivacy = (postId: string) => {
    setEditStatus(prev => prev === 1 ? 0 : 1);
  };

  // Copy link function
  const handleCopyLink = async () => {
    try {
      const currentFamilyTreeId = familyTreeId || '822994d5-7acd-41f8-b12b-e0a634d74440';
      const groupUrl = `${window.location.origin}/group/${currentFamilyTreeId}`;
      await navigator.clipboard.writeText(groupUrl);
      alert('Đã sao chép link vào clipboard!');
      setShowSharePopup(false);
    } catch (err) {
      console.error('Failed to copy: ', err);
      alert('Không thể sao chép link. Vui lòng thử lại!');
    }
  };

  // Handler for modal post editing
  const handleModalEditPost = (postId: string, newContent: string) => {
    console.log('Attempting to save modal edit for post:', postId, 'by user:', getCurrentUserName());

    // Find the post to check ownership before saving
    const postToEdit = posts.find(post => post.id === postId);

    if (!postToEdit) {
      console.error('Post not found:', postId);
      alert('Bài viết không tồn tại!');
      return;
    }

    // Check if user is logged in
    if (!isAuthenticated || !token) {
      console.error('User not authenticated');
      alert('Bạn cần đăng nhập để thực hiện hành động này!');
      return;
    }

    // Check if the current user is the author of the post
    if (!isCurrentUserPost(postToEdit.gpMemberId)) {
      console.warn('User attempting to save modal edit for another user\'s post');
      alert('Bạn chỉ có thể chỉnh sửa bài viết của chính mình!');
      return;
    }

    console.log('Modal edit permission granted, updating post');

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

    console.log('Modal post edit saved successfully');
  };



  const handleDeletePost = (postId: string) => {
    console.log('Attempting to delete post:', postId, 'by user:', getCurrentUserName());

    // Find the post to check ownership
    const postToDelete = posts.find(post => post.id === postId);

    if (!postToDelete) {
      console.error('Post not found:', postId);
      alert('Bài viết không tồn tại!');
      setShowPostMenu(null);
      return;
    }

    console.log('Post found:', postToDelete.author.name, 'vs current user:', getCurrentUserName());

    // Check if user is logged in
    if (!isAuthenticated || !token) {
      console.error('User not authenticated');
      alert('Bạn cần đăng nhập để thực hiện hành động này!');
      setShowPostMenu(null);
      return;
    }

    // Check if the current user is the author of the post
    if (!isCurrentUserPost(postToDelete.gpMemberId)) {
      console.warn('User attempting to delete another user\'s post');
      alert('Bạn chỉ có thể xóa bài viết của chính mình!');
      setShowPostMenu(null);
      return;
    }

    // Confirm deletion
    const confirmMessage = `Bạn có chắc chắn muốn xóa bài viết này?\n\nNội dung: "${postToDelete.content.substring(0, 50)}${postToDelete.content.length > 50 ? '...' : ''}"\n\nHành động này không thể hoàn tác.`;

    if (window.confirm(confirmMessage)) {
      console.log('User confirmed deletion, removing post:', postId);

      // Remove the post from the posts array
      setPosts(prev => prev.filter(post => post.id !== postId));

      // Also close the post detail modal if it's showing the deleted post
      if (selectedPost?.id === postId) {
        setShowPostDetail(false);
        setSelectedPost(null);
      }

      console.log('Post deleted successfully');
      alert('Bài viết đã được xóa thành công!');
    } else {
      console.log('User cancelled deletion');
    }
    setShowPostMenu(null);
  };

  const handleReportComment = (commentId: string) => {
    setReportingCommentId(commentId);
    setShowReportModal(true);
    setShowCommentMenu(null);
  };

  const handleEditComment = async (postId: string, commentId: string) => {
    if (!editCommentContent.trim()) {
      toast.error('Nội dung bình luận không thể trống');
      return;
    }

    try {
      const result = await postService.editComment(commentId, editCommentContent);
      
      console.log('Edit comment result:', result);
      
      const success = result.success || result.status || (result.statusCode === 200);
      
      if (success) {
        // Update comment in posts state recursively
        const updateCommentRecursively = (comments: Comment[]): Comment[] => {
          return comments.map(comment => {
            if (comment.id === commentId) {
              return {
                ...comment,
                content: editCommentContent,
                isEdited: true,
                editedAt: 'Vừa xong'
              };
            }
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: updateCommentRecursively(comment.replies)
              };
            }
            return comment;
          });
        };

        setPosts(prev => prev.map(post =>
          post.id === postId
            ? { ...post, comments: updateCommentRecursively(post.comments) }
            : post
        ));

        // Also update selectedPost if it's the same post
        if (selectedPost?.id === postId) {
          setSelectedPost(prev => prev ? {
            ...prev,
            comments: updateCommentRecursively(prev.comments)
          } : null);
        }

        // Reset edit state
        setEditingCommentId(null);
        setEditCommentContent('');
        setShowCommentMenu(null);
        
        toast.success('Đã cập nhật bình luận');
      } else {
        throw new Error(result.message || 'Failed to edit comment');
      }
    } catch (error: any) {
      console.error('Error editing comment:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi chỉnh sửa bình luận';
      toast.error(errorMessage);
    }
  };

  const handleDeleteComment = async (postId: string, commentId: string) => {
    console.log('Attempting to delete comment:', commentId, 'by user:', getCurrentUserName());

    // Check if user is logged in
    if (!isAuthenticated || !token) {
      console.error('User not authenticated');
      toast.error('Bạn cần đăng nhập để thực hiện hành động này!');
      setShowCommentMenu(null);
      return;
    }

    // Confirm deletion
    const confirmMessage = 'Bạn có chắc chắn muốn xóa bình luận này?\n\nHành động này không thể hoàn tác.';

    if (!window.confirm(confirmMessage)) {
      console.log('User cancelled comment deletion');
      setShowCommentMenu(null);
      return;
    }

    try {
      console.log('User confirmed deletion, calling API to delete comment:', commentId);
      
      const result = await postService.deleteComment(commentId);
      
      console.log('Delete comment result:', result);
      
      const success = result.success || result.status || (result.statusCode === 200);
      
      if (success) {
        // Remove comment from posts state recursively
        const removeCommentRecursively = (comments: Comment[]): Comment[] => {
          return comments
            .filter(c => c.id !== commentId)
            .map(comment => {
              if (comment.replies && comment.replies.length > 0) {
                return {
                  ...comment,
                  replies: removeCommentRecursively(comment.replies)
                };
              }
              return comment;
            });
        };

        setPosts(prev => prev.map(p =>
          p.id === postId
            ? { ...p, comments: removeCommentRecursively(p.comments) }
            : p
        ));

        // Also update selectedPost if it's the same post
        if (selectedPost?.id === postId) {
          setSelectedPost(prev => prev ? {
            ...prev,
            comments: removeCommentRecursively(prev.comments)
          } : null);
        }

        console.log('Comment deleted successfully');
        toast.success('Bình luận đã được xóa thành công!');
      } else {
        throw new Error(result.message || 'Failed to delete comment');
      }
    } catch (error: any) {
      console.error('Error deleting comment:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi xóa bình luận';
      toast.error(errorMessage);
    }
    
    setShowCommentMenu(null);
  };

  const handleSubmitReport = () => {
    if (reportReason.trim()) {
      // TODO: Submit report to backend
      console.log('Reporting comment:', reportingCommentId, 'Reason:', reportReason);
      alert('Báo cáo đã được gửi thành công!');
      setShowReportModal(false);
      setReportReason('');
      setReportingCommentId(null);
    }
  };

  const handleReportPost = (postId: string) => {
    setReportingPostId(postId);
    setShowReportPostModal(true);
    setShowPostMenu(null);
  };

  const handlePostActions = (postId: string) => {
    setReportingPostId(postId);
    setShowReportPostModal(true);
    setShowPostMenu(null);
  };

  const handleSubmitPostReport = () => {
    if (postReportReason.trim()) {
      // TODO: Submit report to backend
      console.log('Reporting post:', reportingPostId, 'Reason:', postReportReason);
      alert('Báo cáo bài viết đã được gửi thành công!');
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
        
        console.log(`Tìm thấy ${filteredPosts.length} bài viết cho từ khóa: "${searchQuery}"`);
      }, 500);
    }
  };

  // Function to clear search and show all posts
  const handleClearSearch = () => {
    setSearchResults([]);
    setIsSearchActive(false);
    setSearchQuery('');
  };

  const handleCommentImageSelect = (postId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    const currentImages = commentImages[postId] || [];

    if (files.length + currentImages.length > 4) {
      alert('Chỉ có thể tải lên tối đa 4 ảnh cho bình luận');
      return;
    }

    const newFiles = [...currentImages, ...files];
    setCommentImages(prev => ({ ...prev, [postId]: newFiles }));

    // Create previews
    const newPreviews: string[] = [];
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === files.length) {
          const currentPreviews = commentImagePreviews[postId] || [];
          setCommentImagePreviews(prev => ({
            ...prev,
            [postId]: [...currentPreviews, ...newPreviews]
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveCommentImage = (postId: string, index: number) => {
    const currentImages = commentImages[postId] || [];
    const currentPreviews = commentImagePreviews[postId] || [];

    const newImages = currentImages.filter((_, i) => i !== index);
    const newPreviews = currentPreviews.filter((_, i) => i !== index);

    setCommentImages(prev => ({ ...prev, [postId]: newImages }));
    setCommentImagePreviews(prev => ({ ...prev, [postId]: newPreviews }));
  };

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
      // Submit reply to API using addComment with parentCommentId
      const result = await postService.addComment({
        postId: postId,
        gpMemberId: gpMemberId,
        content: replyText,
        parentCommentId: parentCommentId, // This makes it a reply
      });
      
      console.log('Reply result:', result);
      
      const success = result.success || result.status || (result.statusCode === 200);
      const data = result.data;
      
      if (success && data) {
        // Create new reply from API response
        const newReply: Comment = {
          id: data.id || `${parentCommentId}-reply-${Date.now()}`,
          gpMemberId: data.gpMemberId || gpMemberId,
          author: {
            name: data.authorName || userData.name || user?.name || 'Username',
            avatar: data.authorPicture || userData.picture || defaultPicture
          },
          content: data.content || replyText,
          timeAgo: 'Vừa xông',
          likes: data.totalReactions || 0,
          isLiked: false,
          replies: []
        };

        // Update posts state with new reply
        setPosts(prev => prev.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              comments: post.comments.map(comment => {
                if (comment.id === parentCommentId) {
                  return {
                    ...comment,
                    replies: [...(comment.replies || []), newReply]
                  };
                }
                return comment;
              })
            };
          }
          return post;
        }));

        // Clear reply input and hide reply interface
        setReplyInputs(prev => ({ ...prev, [parentCommentId]: '' }));
        setReplyingToComment(null);
        
        toast.success('Đã gửi trả lời');
      } else {
        throw new Error(result.message || 'Failed to submit reply');
      }
    } catch (error: any) {
      console.error('Error submitting reply:', error);
      const errorMessage = error.response?.data?.message || error.message || 'Có lỗi xảy ra khi gửi trả lời';
      toast.error(errorMessage);
    }
  };

  const handleOpenPostDetail = (post: Post) => {
    setSelectedPost(post);
    setShowPostDetail(true);
  };

  // Helper function to get current user's name
  const getCurrentUserName = (): string => {
    return userData.name || user?.name || 'Username';
  };

  const isCurrentUserPost = (postGpMemberId: string) => {
    return gpMemberId === postGpMemberId;
  };

  const isCurrentUserComment = (commentAuthorName?: string) => {
    const currentUserName = userData.name || user?.name;
    return currentUserName && commentAuthorName && currentUserName === commentAuthorName;
  };

  // Recursive Comment Component
  const CommentItem: React.FC<{
    comment: Comment;
    postId: string;
    depth?: number;
    maxDepth?: number
  }> = ({ comment, postId, depth = 0, maxDepth = 3 }) => {
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
              comment.gpMemberId && comment.gpMemberId === gpMemberId 
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
                  onChange={(e) => setEditCommentContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  rows={3}
                  autoFocus
                />
                <div className="flex items-center space-x-2 mt-2">
                  <button
                    onClick={() => handleEditComment(postId, comment.id)}
                    className="px-3 py-1 bg-blue-600 text-white text-xs rounded-md hover:bg-blue-700"
                  >
                    Lưu
                  </button>
                  <button
                    onClick={() => {
                      setEditingCommentId(null);
                      setEditCommentContent('');
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
                  onClick={() => handleLike(comment.id, 'comment', postId)}
                  className={`hover:underline ${comment.isLiked ? 'text-blue-600 font-semibold' : ''}`}
                >
                  Thích
                </button>
                {canReply && (
                  <button
                    onClick={() => setReplyingToComment(replyingToComment === comment.id ? null : comment.id)}
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
                    onClick={() => setCollapsedReplies(prev => ({ ...prev, [comment.id]: !prev[comment.id] }))}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    {collapsedReplies[comment.id] ? '▶' : '▼'} {comment.replies.length} phản hồi
                  </button>
                )}
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowCommentMenu(showCommentMenu === comment.id ? null : comment.id)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <MoreHorizontal className="w-3 h-3" />
                </button>
                {showCommentMenu === comment.id && (
                  <div className="absolute right-0 top-6 w-40 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
                    {comment.gpMemberId && comment.gpMemberId === gpMemberId ? (
                      // Own comment - show Edit and Delete
                      <>
                        <button
                          onClick={() => {
                            setEditingCommentId(comment.id);
                            setEditCommentContent(comment.content);
                            setShowCommentMenu(null);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-xs"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Chỉnh sửa</span>
                        </button>
                        <button
                          onClick={() => handleDeleteComment(postId, comment.id)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-red-600 text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Xóa</span>
                        </button>
                      </>
                    ) : (
                      // Other user's comment - show Report only
                      <button
                        onClick={() => handleReportComment(comment.id)}
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
              <div className="mt-3">
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
                    value={replyInputs[comment.id] || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setReplyInputs(prev => ({ ...prev, [comment.id]: e.target.value }))}
                    placeholder="Viết trả lời..."
                    className="flex-1 px-3 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                      if (e.key === 'Enter') {
                        handleReplySubmit(postId, comment.id);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleReplySubmit(postId, comment.id)}
                    disabled={!replyInputs[comment.id]?.trim()}
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
        {comment.replies && comment.replies.length > 0 && !collapsedReplies[comment.id] && (
          <div className={`mt-3 space-y-3 ${depth > 0 ? 'pl-3' : ''}`}>
            {comment.replies.map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                postId={postId}
                depth={depth + 1}
                maxDepth={maxDepth}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full bg-gray-50">
      <div className="h-full">
        {/* Group Banner */}
        <div className="relative">
          {/* Cover Photo */}
          <div className="h-80 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 relative overflow-hidden">
            <img
              src={familyTreeData?.picture || "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1200&h=400&fit=crop"}
              alt="Group cover"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-black/30"></div>
          </div>

          {/* Group Info */}
          <div className="bg-white border-b border-gray-200 px-4">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-end justify-between pb-6 mt-4">
                <div className="flex items-end space-x-6">
                  {/* Group Details */}
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                      {familyTreeLoading ? (
                        <div className="h-10 bg-gray-200 rounded animate-pulse w-64"></div>
                      ) : (
                        familyTreeData?.name || 'Gia Phả Gia Đình'
                      )}
                    </h1>
                    <div className="flex items-center space-x-4 text-gray-600 mb-2">
                      <span className="text-sm font-medium">
                        {familyTreeLoading ? (
                          <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                        ) : (
                          `${familyTreeData?.numberOfMember || 0} thành viên`
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-3 pb-2">
                  <button className="flex items-center space-x-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium">
                    <Plus className="w-4 h-4" />
                    <span>Mời</span>
                  </button>
                  <button
                    onClick={() => setShowSharePopup(true)}
                    className="flex items-center space-x-2 px-6 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors font-medium"
                  >
                    <Share className="w-4 h-4" />
                    <span>Chia sẻ</span>
                  </button>
                  <button className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setShowSearchPopup(true)}
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-4 sm:px-6 lg:px-8 py-6">

          <div className="flex justify-center">
            <div className="w-full max-w-7xl flex gap-6 lg:gap-8">
              {/* Main Content */}
              <div className="flex-1 max-w-none lg:max-w-2xl space-y-6">
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
                      {userData.picture ? (
                        <img
                          src={userData.picture}
                          alt="Your avatar"
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
                        onClick={() => setShowCreatePostModal(true)}
                        disabled={gpMemberLoading || !!gpMemberError || !gpMemberId}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm">📍</span>
                        </div>
                        <span className="text-sm font-medium">Sự kiện trong đời</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Debug Panel (Development Only) */}
                {import.meta.env.DEV && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="text-sm font-semibold text-blue-800 mb-2">Debug Info (Dev Only)</h4>
                    <div className="text-xs text-blue-700 space-y-1">
                      <div><strong>GPMemberId:</strong> {gpMemberId || 'Loading...'}</div>
                      <div><strong>Family Tree ID:</strong> {currentFamilyTreeId}</div>
                      <div><strong>User ID:</strong> {currentUserId}</div>
                      <div><strong>Loading:</strong> {gpMemberLoading ? 'Yes' : 'No'}</div>
                      <div><strong>Error:</strong> {gpMemberError || 'None'}</div>
                      {gpMember && (
                        <>
                          <div><strong>Member Name:</strong> {gpMember.fullname}</div>
                          <div><strong>Role:</strong> {gpMember.ftRole}</div>
                          <div><strong>Email:</strong> {gpMember.email}</div>
                        </>
                      )}
                    </div>
                    
                    {/* Test Button */}
                    <button
                      onClick={() => {
                        console.log('=== GPMember Debug Info ===');
                        console.log('GPMemberId:', gpMemberId);
                        console.log('Family Tree ID:', currentFamilyTreeId);
                        console.log('User ID:', currentUserId);
                        console.log('Loading:', gpMemberLoading);
                        console.log('Error:', gpMemberError);
                        console.log('Full GPMember data:', gpMember);
                        console.log('=========================');
                      }}
                      className="mt-2 px-3 py-1 bg-blue-200 hover:bg-blue-300 text-blue-800 text-xs rounded"
                    >
                      Log Debug Info
                    </button>
                  </div>
                )}

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
                  <div key={post.id} className="bg-white shadow-sm rounded-lg border border-gray-200">
                    {/* Post Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <img
                            src={
                              post.gpMemberId && post.gpMemberId === gpMemberId
                                ? (userData.picture || post.author.avatar || defaultPicture)
                                : (post.author.avatar || defaultPicture)
                            }
                            alt={post.author.name}
                            className="w-12 h-12 rounded-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = defaultPicture;
                            }}
                          />
                          <div>
                            <h3 className="font-semibold text-gray-900">{post.author.name}</h3>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleOpenPostDetail(post)}
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
                              onClick={() => handlePostActions(post.id)}
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
                                    onClick={() => handleReportPost(post.id)}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-red-600"
                                  >
                                    <Flag className="w-4 h-4" />
                                    <span>Báo cáo bài viết</span>
                                  </button>
                                </div>
                              )}
                            </>
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
                                onClick={() => togglePostPrivacy(post.id)}
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
                                      onClick={() => removeExistingImage(image.id)}
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
                                        onClick={() => removeEditImage(index)}
                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                    <input
                                      type="text"
                                      value={editCaptions[index] || ''}
                                      onChange={(e) => updateEditCaption(index, e.target.value)}
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
                              onChange={handleEditImageSelect}
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
                              onClick={handleCancelEdit}
                              disabled={isUpdatingPost}
                              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={() => handleSaveEdit(post.id)}
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

                    {/* Post Images */}
                    {post.images && post.images.length > 0 && (
                      <div className="px-6 pb-4">
                        <div className={`grid gap-2 ${post.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                          {post.images.map((image, index) => (
                            <img
                              key={index}
                              src={image}
                              alt={`Post image ${index + 1}`}
                              className="w-full h-64 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => handleOpenPostDetail(post)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Post Stats */}
                    <div className="px-6 py-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-1 relative">
                          {post.totalReactions > 0 ? (
                            <>
                              <div className="flex items-center space-x-1 cursor-pointer hover:underline"
                                   onClick={() => handleReactionSummaryClick(post.id)}
                                   onMouseEnter={() => setHoveredPost(post.id)}
                                   onMouseLeave={() => setHoveredPost(null)}>
                                <span className="text-lg">{getReactionSummaryText(post)}</span>
                                <span>{post.totalReactions}</span>
                              </div>
                              
                              {/* Reaction tooltip on hover */}
                              {hoveredPost === post.id && (
                                <div 
                                  className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 mt-8 min-w-48"
                                  onMouseEnter={() => setHoveredPost(post.id)}
                                  onMouseLeave={() => setHoveredPost(null)}
                                >
                                  <div className="space-y-1 text-sm">
                                    {Object.entries(post.reactionsSummary)
                                      .sort((a, b) => b[1] - a[1])
                                      .map(([type, count]) => {
                                      const reactionEmoji = reactionTypes.find(r => r.type.toLowerCase() === type.toLowerCase())?.emoji || '👍';
                                      const reactionLabel = reactionTypes.find(r => r.type.toLowerCase() === type.toLowerCase())?.label || type;
                                      return (
                                        <div key={type} className="flex items-center justify-between">
                                          <span className="flex items-center space-x-2">
                                            <span className="text-base">{reactionEmoji}</span>
                                            <span>{reactionLabel}</span>
                                          </span>
                                          <span className="font-medium">{count}</span>
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}
                            </>
                          ) : (
                            <span>0 phản ứng</span>
                          )}
                        </div>
                        <div>
                          {post.comments.length > 0 && (
                            <span>{post.comments.length} bình luận</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Post Actions */}
                    <div className="px-6 py-3 border-t border-gray-200">
                      <div className="flex items-center justify-around">
                        <div className="relative">
                          <button
                            onMouseEnter={() => setShowReactionPicker(post.id)}
                            onMouseLeave={() => {
                              // Delay hiding to allow hovering over picker
                              setTimeout(() => {
                                if (showReactionPicker === post.id) {
                                  setShowReactionPicker(null);
                                }
                              }, 300);
                            }}
                            onClick={() => {
                              // If user already has a reaction, clicking toggles it off
                              // If no reaction, add Like by default
                              const reactionToToggle = post.userReaction || 'Like';
                              handleReaction(post.id, reactionToToggle);
                            }}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors relative ${
                              post.userReaction ? 'text-blue-600' : 'text-gray-600'
                            }`}
                          >
                            {post.userReaction ? (
                              <span className="text-lg">
                                {reactionTypes.find(r => r.type === post.userReaction)?.emoji || '👍'}
                              </span>
                            ) : (
                              <ThumbsUp className="w-5 h-5" />
                            )}
                            <span className="font-medium">
                              {post.userReaction ? reactionTypes.find(r => r.type === post.userReaction)?.label : 'Thích'}
                            </span>
                          </button>

                          {/* Reaction Picker */}
                          {showReactionPicker === post.id && (
                            <div 
                              className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-full shadow-lg p-2 flex space-x-2 z-50"
                              onMouseEnter={() => setShowReactionPicker(post.id)}
                              onMouseLeave={() => setShowReactionPicker(null)}
                            >
                              {reactionTypes.map((reaction) => (
                                <button
                                  key={reaction.type}
                                  onClick={() => handleReaction(post.id, reaction.type)}
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
                          onClick={() => {
                            const input = document.querySelector(`#comment-input-${post.id}`) as HTMLInputElement;
                            if (input) input.focus();
                          }}
                          className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span className="font-medium">Bình luận</span>
                        </button>
                      </div>
                    </div>

                    {/* Comments Section */}
                    {post.comments.length > 0 && (
                      <div className="px-6 pb-4 border-t border-gray-200">
                        <div className="space-y-4 mt-4">
                          {post.comments.map((comment) => (
                            <CommentItem
                              key={comment.id}
                              comment={comment}
                              postId={post.id}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Comment Input - Always Visible */}
                    <div className="px-6 pb-4 border-t border-gray-200">
                      <div className="flex items-start space-x-3 mt-4">
                        {userData.picture ? (
                          <img
                            src={userData.picture}
                            alt="Your avatar"
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = defaultPicture;
                            }}
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                            <User size={16} className="text-gray-500" />
                          </div>
                        )}
                        <div className="flex-1">
                          {/* Comment Image Previews */}
                          {(commentImagePreviews[post.id]?.length || 0) > 0 && (
                            <div className="mb-3 grid grid-cols-2 gap-2">
                              {commentImagePreviews[post.id]?.map((preview, index) => (
                                <div key={index} className="relative">
                                  <img
                                    src={preview}
                                    alt={`Preview ${index + 1}`}
                                    className="w-full h-20 object-cover rounded-lg"
                                  />
                                  <button
                                    onClick={() => handleRemoveCommentImage(post.id, index)}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                                  >
                                    ×
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="flex items-center space-x-2">
                            <input
                              id={`comment-input-${post.id}`}
                              type="text"
                              value={commentInputs[post.id] || ''}
                              onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                              placeholder="Viết bình luận..."
                              className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent"
                              onKeyPress={(e) => {
                                if (e.key === 'Enter') {
                                  handleCommentSubmit(post.id);
                                }
                              }}
                            />

                            {/* Image Upload Button */}
                            <div className="relative">
                              <input
                                type="file"
                                id={`comment-image-${post.id}`}
                                multiple
                                accept="image/*"
                                onChange={(e) => handleCommentImageSelect(post.id, e)}
                                className="hidden"
                              />
                              <label
                                htmlFor={`comment-image-${post.id}`}
                                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full cursor-pointer transition-colors"
                              >
                                <Image className="w-5 h-5" />
                              </label>
                            </div>

                            <button
                              onClick={() => handleCommentSubmit(post.id)}
                              disabled={!commentInputs[post.id]?.trim() && (commentImagePreviews[post.id]?.length || 0) === 0}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent transition-colors"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          </div>

                          {/* Comment Actions */}
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <button className="hover:underline flex items-center space-x-1">
                              <Smile className="w-3 h-3" />
                              <span>Emoji</span>
                            </button>
                            <button className="hover:underline flex items-center space-x-1">
                              <Image className="w-3 h-3" />
                              <span>Ảnh</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right Sidebar */}
              <div className="w-80 space-y-4 hidden lg:block">
                {/* Family Tree Statistics */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-5 py-4">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-white" />
                      <h3 className="font-semibold text-white">Thống kê</h3>
                    </div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Tổng bài viết</p>
                          <p className="text-2xl font-bold text-gray-900">{posts.length}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <MessageCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Tổng bình luận</p>
                          <p className="text-2xl font-bold text-gray-900">
                            {posts.reduce((sum, post) => sum + post.comments.length, 0)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center">
                          <ThumbsUp className="w-5 h-5 text-pink-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Tổng phản ứng</p>
                          <p className="text-2xl font-bold text-gray-900">
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
                      <span className="text-lg">🏆</span>
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
                      
                      // Get top 5 authors
                      const topAuthors = Object.values(authorCounts)
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
                          {topAuthors.map((author, index) => (
                            <div key={index} className="flex items-center space-x-3 p-3 rounded-xl hover:bg-gray-50 transition-all duration-200 group">
                              <div className="relative">
                                <img
                                  src={author.avatar || defaultPicture}
                                  alt={author.name}
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
                                <p className="text-sm font-semibold text-gray-900 truncate">{author.name}</p>
                                <p className="text-xs text-gray-500 flex items-center space-x-1">
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                                    <path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
                                  </svg>
                                  <span>{author.count} bài viết</span>
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-8">Chưa có dữ liệu</p>
                      );
                    })()}
                  </div>
                </div>

                {/* Most Reacted Posts */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                      <span className="text-lg">⭐</span>
                      <span>Bài viết nổi bật</span>
                    </h3>
                  </div>
                  <div className="p-4">
                    {(() => {
                      const topPosts = [...posts]
                        .sort((a, b) => (b.totalReactions || 0) - (a.totalReactions || 0))
                        .slice(0, 3);
                      
                      return topPosts.length > 0 ? (
                        <div className="space-y-3">
                          {topPosts.map((post, index) => (
                            <div 
                              key={post.id}
                              onClick={() => handleOpenPostDetail(post)}
                              className="group p-3 bg-gradient-to-br from-gray-50 to-white rounded-xl hover:from-blue-50 hover:to-white border border-gray-100 hover:border-blue-200 cursor-pointer transition-all duration-200 hover:shadow-md"
                            >
                              <div className="flex items-start space-x-3 mb-2">
                                <div className="relative">
                                  <img
                                    src={post.author.avatar || defaultPicture}
                                    alt={post.author.name}
                                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).src = defaultPicture;
                                    }}
                                  />
                                  {index < 3 && (
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                      {index + 1}
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-gray-900 truncate">{post.author.name}</p>
                                  <p className="text-xs text-gray-500">{post.author.timeAgo}</p>
                                </div>
                              </div>
                              <p className="text-sm text-gray-700 line-clamp-2 mb-3 leading-relaxed">{post.content}</p>
                              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                <div className="flex items-center space-x-3 text-xs">
                                  <span className="flex items-center space-x-1 text-pink-600 font-medium">
                                    <ThumbsUp className="w-3.5 h-3.5" />
                                    <span>{post.totalReactions || 0}</span>
                                  </span>
                                  <span className="flex items-center space-x-1 text-green-600 font-medium">
                                    <MessageCircle className="w-3.5 h-3.5" />
                                    <span>{post.comments.length}</span>
                                  </span>
                                </div>
                                <span className="text-xs text-blue-600 font-medium group-hover:underline">
                                  Xem chi tiết →
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-8">Chưa có bài viết nào</p>
                      );
                    })()}
                  </div>
                </div>

                {/* Reaction Summary */}
                {(() => {
                  const totalReactionsByType = posts.reduce((acc: { [key: string]: number }, post) => {
                    Object.entries(post.reactionsSummary || {}).forEach(([type, count]) => {
                      acc[type] = (acc[type] || 0) + (count as number);
                    });
                    return acc;
                  }, {});
                  
                  const hasReactions = Object.keys(totalReactionsByType).length > 0;
                  const totalReactions = Object.values(totalReactionsByType).reduce((sum, count) => sum + count, 0);
                  
                  return hasReactions ? (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                      <div className="px-5 py-4 border-b border-gray-100">
                        <h3 className="font-semibold text-gray-900 flex items-center space-x-2">
                          <span className="text-lg">😊</span>
                          <span>Phản ứng phổ biến</span>
                        </h3>
                      </div>
                      <div className="p-4">
                        <div className="space-y-3">
                          {Object.entries(totalReactionsByType)
                            .sort((a, b) => b[1] - a[1])
                            .map(([type, count]) => {
                              const reaction = reactionTypes.find(r => r.type.toLowerCase() === type.toLowerCase());
                              const percentage = ((count / totalReactions) * 100).toFixed(1);
                              return (
                                <div key={type} className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-2">
                                      <span className="text-2xl">{reaction?.emoji || '👍'}</span>
                                      <span className="text-sm font-semibold text-gray-700">{reaction?.label || type}</span>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <span className="text-xs text-gray-500">{percentage}%</span>
                                      <span className="text-sm font-bold text-gray-900">{count}</span>
                                    </div>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                                    <div 
                                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-full rounded-full transition-all duration-500"
                                      style={{ width: `${percentage}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 font-medium">Tổng phản ứng</span>
                            <span className="text-lg font-bold text-blue-600">{totalReactions}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : null;
                })()}
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
                  <div className="flex items-center space-x-3">
                    {userData.picture ? (
                      <img 
                        src={userData.picture} 
                        alt="Avatar" 
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
                        {userData?.name || 'User'}
                      </p>
                    </div>
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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
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

        {/* Post Detail Modal */}
        <PostDetailPage
          isOpen={showPostDetail}
          post={selectedPost}
          onClose={() => setShowPostDetail(false)}
          commentInputs={commentInputs}
          setCommentInputs={setCommentInputs}
          onLikePost={handleLike}
          onCommentSubmit={handleCommentSubmit}
          onEditPost={handleModalEditPost}
          CommentItem={CommentItem}
        />
      </div>
    </div>
  );
};

export default PostPage;