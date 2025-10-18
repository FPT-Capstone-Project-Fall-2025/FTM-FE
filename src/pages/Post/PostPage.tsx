import React, { useState, useRef, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppSelector } from '../../hooks/redux';
import defaultPicture from '@/assets/dashboard/default-avatar.png';
import { MessageCircle, MoreHorizontal, Send, Image, Smile, X, ThumbsUp, Search, Edit, Trash2, Flag, Users, User, Eye, Settings, Share, Plus } from 'lucide-react';
import PostDetailPage from './PostDetailPage';
import postService, { type PostData, type CreatePostData } from '@/services/postService';
import familyTreeService from '@/services/familyTreeService';
import { getUserIdFromToken, getFullNameFromToken } from '@/utils/jwtUtils';
import userService from '@/services/userService';

interface Post {
  id: string;
  title?: string;
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
}

interface Comment {
  id: string;
  author?: {
    name: string;
    avatar: string;
  };
  content: string;
  images?: string[];
  timeAgo: string;
  likes: number;
  isLiked: boolean;
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
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
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

  // Reaction types
  const reactionTypes = [
    { type: 'Like', emoji: '👍', label: 'Thích' },
    { type: 'Love', emoji: '❤️', label: 'Yêu thích' },
    { type: 'Haha', emoji: '😆', label: 'Haha' },
    { type: 'Wow', emoji: '😮', label: 'Wow' },
    { type: 'Sad', emoji: '😢', label: 'Buồn' },
    { type: 'Angry', emoji: '😠', label: 'Giận dữ' }
  ];

  // Function to transform API comment to Comment interface
  const transformApiComment = (apiComment: any): Comment => {
    return {
      id: apiComment.id || `comment-${Date.now()}-${Math.random()}`,
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

  // Function to load reactions for a post
  const loadPostReactions = async (postId: string) => {
    try {
      const result = await postService.getPostReactions(postId);
      const success = result.success || result.status || (result.statusCode === 200);
      
      if (success && result.data) {
        setPostReactions(prev => ({ ...prev, [postId]: result.data }));
        
        // Check if current user has reacted
        const currentUserId = getUserIdFromToken(token || '');
        const userReaction = result.data.find((reaction: any) => reaction.gpMemberId === currentUserId);
        
        // Update post with user reaction
        setPosts(prev => prev.map(post => 
          post.id === postId 
            ? { ...post, userReaction: userReaction?.reactionType || null }
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
      const post = posts.find(p => p.id === postId);
      if (!post) return;

      // If user already has this reaction, remove it
      if (post.userReaction === reactionType) {
        await postService.removePostReaction(postId);
        
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
              totalReactions: Math.max(0, p.totalReactions - 1),
              reactionsSummary: newReactionsSummary,
              isLiked: false
            };
          }
          return p;
        }));
      } else {
        // Add or change reaction
        await postService.addPostReaction(postId, reactionType);
        
        // Update local state
        setPosts(prev => prev.map(p => {
          if (p.id === postId) {
            const newReactionsSummary = { ...p.reactionsSummary };
            
            // Remove old reaction if exists
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
            
            const totalChange = p.userReaction ? 0 : 1; // Only increase if no previous reaction
            
            return {
              ...p,
              userReaction: reactionType,
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
    } catch (error) {
      console.error('Error handling reaction:', error);
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
      alert('Chỉ có thể tải lên tối đa 4 ảnh');
      return;
    }

    const validFiles = files.filter(file => {
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} quá lớn. Kích thước tối đa là 5MB`);
        return false;
      }
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'video/mp4', 'video/avi', 'video/mov'];
      if (!allowedTypes.includes(file.type)) {
        alert(`File ${file.name} không đúng định dạng. Chỉ chấp nhận JPEG, JPG, PNG, GIF, MP4, AVI, MOV`);
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
      alert('Vui lòng nhập nội dung bài viết hoặc chọn ảnh');
      return;
    }

    // Validate content length
    if (postContent.trim().length > 5000) {
      alert('Nội dung bài viết không được vượt quá 5000 ký tự');
      return;
    }

    // Validate title length if provided
    if (postTitle.trim().length > 200) {
      alert('Tiêu đề bài viết không được vượt quá 200 ký tự');
      return;
    }

    // Use familyTreeId from params or fallback to a default one for testing
    const currentFamilyTreeId = familyTreeId || '374a1ace-479b-435b-9bcf-05ea83ef7d17'; // Use the same ID as in curl example
    
    if (!currentFamilyTreeId) {
      alert('Không tìm thấy ID gia phả');
      return;
    }

    if (!token || !isAuthenticated) {
      alert('Bạn cần đăng nhập để tạo bài viết');
      return;
    }

    setIsPosting(true);

    try {
      // Extract user ID from JWT token
      let memberId: string | null = null;
      
      try {
        memberId = getUserIdFromToken(token!);
        console.log('Extracted member ID from JWT:', memberId);
      } catch (jwtError) {
        console.error('Error extracting user ID from JWT:', jwtError);
      }
      
      // Fallback to user state if JWT extraction fails
      if (!memberId && user?.userId) {
        memberId = user.userId;
        console.log('Using user state member ID:', memberId);
      }
      
      // If still no member ID, show error instead of using fallback
      if (!memberId) {
        alert('Không thể xác định thông tin người dùng. Vui lòng đăng nhập lại.');
        return;
      }
      
      // Prepare data according to API structure
      const postData: CreatePostData = {
        GPId: currentFamilyTreeId,
        Title: postTitle.trim() || 'Untitled Post',
        Content: postContent.trim(),
        GPMemberId: memberId,
        Status: 1,
        Files: selectedImages.length > 0 ? selectedImages : undefined,
        Captions: fileCaptions.length > 0 ? fileCaptions : undefined,
        FileTypes: selectedImages.length > 0 ? selectedImages.map(file => {
          if (file.type.startsWith('image/')) return 'image';
          if (file.type.startsWith('video/')) return 'video';
          return 'file';
        }) : undefined
      };

      console.log('Creating post with data:', postData);
      console.log('User info (state):', user);
      console.log('User data (API):', userData);
      console.log('Family Tree ID:', currentFamilyTreeId);
      console.log('Extracted Member ID from JWT:', memberId);
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
          author: {
            name: data.authorName || userData.name || 'Username',
            avatar: data.authorPicture || userData.picture || defaultPicture,
            timeAgo: 'Vừa xong'
          },
          content: data.content,
          images: data.attachments?.map((file: any) => file.url) || [],
          likes: data.totalReactions || 0,
          totalReactions: data.totalReactions || 0,
          reactionsSummary: data.reactionsSummary || {},
          userReaction: null,
          isLiked: false,
          comments: response.data.comments || [],
          title: response.data.title
        };

        setPosts(prev => [newPost, ...prev]);
        
        // Close modal and reset form
        handleCloseCreatePostModal();
        
        alert('Bài viết đã được tạo thành công!');
      } else {
        console.error('Post creation failed:', response);
        throw new Error(response.message || 'Failed to create post');
      }
    } catch (error: any) {
      console.error('Error creating post:', error);
      
      // More specific error messages
      let errorMessage = 'Có lỗi xảy ra khi tạo bài viết. Vui lòng thử lại!';
      
      if (error.response?.status === 400) {
        errorMessage = 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại thông tin.';
      } else if (error.response?.status === 401) {
        errorMessage = 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
      } else if (error.response?.status === 403) {
        errorMessage = 'Bạn không có quyền thực hiện hành động này.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      alert(errorMessage);
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

    if (!commentText && images.length === 0) return;

    try {
      // Submit comment to API
      const result = await postService.addComment(postId, commentText || '', images);
      
      // Handle both API response formats
      const success = result.success || result.status || (result.statusCode === 200);
      const data = result.data;
      
      if (success && data) {
        // Create new comment from API response
        const newComment: Comment = {
          id: data.id || `${postId}-${Date.now()}`,
          author: {
            name: data.authorName || userData.name || getCurrentUserName(),
            avatar: data.authorPicture || userData.picture || defaultPicture
          },
          content: data.content || commentText || '',
          images: data.attachments?.map((file: any) => file.url) || [],
          timeAgo: 'Vừa xong',
          likes: data.totalReactions || 0,
          isLiked: false
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
      } else {
        throw new Error(result.message || 'Failed to submit comment');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      alert('Có lỗi xảy ra khi gửi bình luận. Vui lòng thử lại.');
      
      // Fallback: Add comment locally (temporary until refresh)
      const newComment: Comment = {
        id: `${postId}-${Date.now()}`,
        author: {
          name: userData.name || getCurrentUserName(),
          avatar: userData.picture || defaultPicture
        },
        content: commentText || '',
        images: commentImagePreviews[postId] || [],
        timeAgo: 'Vừa xong',
        likes: 0,
        isLiked: false
      };

      setPosts(prev => prev.map(post =>
        post.id === postId
          ? { ...post, comments: [...post.comments, newComment] }
          : post
      ));

      // Clear comment input and images
      setCommentInputs(prev => ({ ...prev, [postId]: '' }));
      setCommentImages(prev => ({ ...prev, [postId]: [] }));
      setCommentImagePreviews(prev => ({ ...prev, [postId]: [] }));
    }
  };

  // New handler functions
  const handleEditPost = (postId: string, content: string) => {
    console.log('Attempting to edit post:', postId, 'by user:', getCurrentUserName());

    // Find the post to check ownership
    const postToEdit = posts.find(post => post.id === postId);

    if (!postToEdit) {
      console.error('Post not found:', postId);
      alert('Bài viết không tồn tại!');
      setShowPostMenu(null);
      return;
    }

    // Check if user is logged in
    if (!user) {
      console.error('User not logged in');
      alert('Bạn cần đăng nhập để thực hiện hành động này!');
      setShowPostMenu(null);
      return;
    }

    // Check if the current user is the author of the post
    if (!isCurrentUserPost(postToEdit.author.name)) {
      console.warn('User attempting to edit another user\'s post');
      alert('Bạn chỉ có thể chỉnh sửa bài viết của chính mình!');
      setShowPostMenu(null);
      return;
    }

    console.log('Edit permission granted, opening edit mode');
    setEditingPostId(postId);
    setEditContent(content);
    setShowPostMenu(null);
  };

  const handleSaveEdit = (postId: string) => {
    console.log('Attempting to save edit for post:', postId, 'by user:', getCurrentUserName());

    // Find the post to check ownership before saving
    const postToEdit = posts.find(post => post.id === postId);

    if (!postToEdit) {
      console.error('Post not found:', postId);
      alert('Bài viết không tồn tại!');
      setEditingPostId(null);
      setEditContent('');
      return;
    }

    // Check if user is logged in
    if (!user) {
      console.error('User not logged in');
      alert('Bạn cần đăng nhập để thực hiện hành động này!');
      setEditingPostId(null);
      setEditContent('');
      return;
    }

    // Check if the current user is the author of the post
    if (!isCurrentUserPost(postToEdit.author.name)) {
      console.warn('User attempting to save edit for another user\'s post');
      alert('Bạn chỉ có thể chỉnh sửa bài viết của chính mình!');
      setEditingPostId(null);
      setEditContent('');
      return;
    }

    console.log('Save permission granted, updating post');

    setPosts(prev => prev.map(post =>
      post.id === postId ? {
        ...post,
        content: editContent,
        isEdited: true,
        editedAt: 'Vừa xong'
      } : post
    ));

    // Also update selectedPost if it's the same post being edited
    if (selectedPost?.id === postId) {
      setSelectedPost(prev => prev ? {
        ...prev,
        content: editContent,
        isEdited: true,
        editedAt: 'Vừa xong'
      } : null);
    }

    setEditingPostId(null);
    setEditContent('');
    console.log('Post edit saved successfully');
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
    if (!user) {
      console.error('User not logged in');
      alert('Bạn cần đăng nhập để thực hiện hành động này!');
      return;
    }

    // Check if the current user is the author of the post
    if (!isCurrentUserPost(postToEdit.author.name)) {
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

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditContent('');
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
    if (!user) {
      console.error('User not logged in');
      alert('Bạn cần đăng nhập để thực hiện hành động này!');
      setShowPostMenu(null);
      return;
    }

    // Check if the current user is the author of the post
    if (!isCurrentUserPost(postToDelete.author.name)) {
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

  const handleDeleteComment = (postId: string, commentId: string) => {
    console.log('Attempting to delete comment:', commentId, 'by user:', getCurrentUserName());

    // Find the post and comment to check ownership
    const post = posts.find(p => p.id === postId);
    if (!post) {
      console.error('Post not found:', postId);
      alert('Bài viết không tồn tại!');
      setShowCommentMenu(null);
      return;
    }

    const comment = post.comments.find(c => c.id === commentId);
    if (!comment) {
      console.error('Comment not found:', commentId);
      alert('Bình luận không tồn tại!');
      setShowCommentMenu(null);
      return;
    }

    // Check if user is logged in
    if (!user) {
      console.error('User not logged in');
      alert('Bạn cần đăng nhập để thực hiện hành động này!');
      setShowCommentMenu(null);
      return;
    }

    // Check if the current user is the author of the comment
    if (!isCurrentUserComment(comment.author?.name)) {
      console.warn('User attempting to delete another user\'s comment');
      alert('Bạn chỉ có thể xóa bình luận của chính mình!');
      setShowCommentMenu(null);
      return;
    }

    // Confirm deletion
    const confirmMessage = `Bạn có chắc chắn muốn xóa bình luận này?\n\nNội dung: "${comment.content.substring(0, 50)}${comment.content.length > 50 ? '...' : ''}"\n\nHành động này không thể hoàn tác.`;

    if (window.confirm(confirmMessage)) {
      console.log('User confirmed deletion, removing comment:', commentId);

      // Remove the comment from the post
      setPosts(prev => prev.map(p =>
        p.id === postId
          ? { ...p, comments: p.comments.filter(c => c.id !== commentId) }
          : p
      ));

      // Also update selectedPost if it's the same post
      if (selectedPost?.id === postId) {
        setSelectedPost(prev => prev ? {
          ...prev,
          comments: prev.comments.filter(c => c.id !== commentId)
        } : null);
      }

      console.log('Comment deleted successfully');
      alert('Bình luận đã được xóa thành công!');
    } else {
      console.log('User cancelled comment deletion');
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
    if (!replyText) return;

    try {
      // Submit reply to API
      const result = await postService.addCommentReply(parentCommentId, replyText);
      
      if (result.success && result.data) {
        // Create new reply from API response
        const newReply: Comment = {
          id: result.data.id || `${parentCommentId}-reply-${Date.now()}`,
          author: {
            name: result.data.authorName || userData.name || user?.name || 'Username',
            avatar: result.data.authorPicture || userData.picture || defaultPicture
          },
          content: result.data.content || replyText,
          timeAgo: 'Vừa xong',
          likes: result.data.totalReactions || 0,
          isLiked: false
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
      } else {
        throw new Error(result.message || 'Failed to submit reply');
      }
    } catch (error) {
      console.error('Error submitting reply:', error);
      alert('Có lỗi xảy ra khi gửi trả lời. Vui lòng thử lại.');
      
      // Fallback: Add reply locally (temporary until refresh)
      const newReply: Comment = {
        id: `${parentCommentId}-reply-${Date.now()}`,
        author: {
          name: userData.name || user?.name || 'Username',
          avatar: userData.picture || defaultPicture
        },
        content: replyText,
        timeAgo: 'Vừa xong',
        likes: 0,
        isLiked: false
      };

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
    }
  };

  const handleOpenPostDetail = (post: Post) => {
    setSelectedPost(post);
    setShowPostDetail(true);
  };

  // Helper function to get current user's name
  const getCurrentUserName = (): string => {
    return user?.name || 'Username';
  };

  const isCurrentUserPost = (authorName: string) => {
    return user?.name === authorName;
  };

  const isCurrentUserComment = (commentAuthorName?: string) => {
    return user?.name && commentAuthorName && user.name === commentAuthorName;
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
            src={comment.author?.avatar || defaultPicture}
            alt={comment.author?.name || 'User'}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0 relative z-10 bg-white"
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultPicture;
            }}
          />
          <div className="flex-1">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <p className="font-semibold text-sm text-gray-900">{comment.author?.name || 'User'}</p>
              <p className="text-gray-900">{comment.content}</p>

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
                    {isCurrentUserComment(comment.author?.name) ? (
                      <>
                        <button
                          onClick={() => {
                            // TODO: Implement edit comment functionality
                            alert('Tính năng chỉnh sửa bình luận sẽ được triển khai sau');
                            setShowCommentMenu(null);
                          }}
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-xs"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Chỉnh sửa bình luận</span>
                        </button>
                        <button
                          onClick={() => handleDeleteComment(postId, comment.id)}
                          className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-red-600 text-xs"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Xóa bình luận</span>
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleReportComment(comment.id)}
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-red-600 text-xs"
                      >
                        <Flag className="w-3 h-3" />
                        <span>Báo cáo bình luận</span>
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
                      >
                        Bạn đang nghĩ gì?
                      </button>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex items-center justify-around mt-3 pt-3 border-t border-gray-200">
                      <button
                        onClick={() => setShowCreatePostModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors text-green-600"
                      >
                        <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                          <Image className="w-4 h-4 text-green-600" />
                        </div>
                        <span className="text-sm font-medium">Ảnh/video</span>
                      </button>

                      <button
                        onClick={() => setShowCreatePostModal(true)}
                        className="flex items-center space-x-2 px-4 py-2 hover:bg-gray-100 rounded-lg transition-colors text-blue-600"
                      >
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-blue-600 text-sm">📍</span>
                        </div>
                        <span className="text-sm font-medium">Sự kiện trong đời</span>
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
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Tạo bài viết đầu tiên
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
                            src={post.author.avatar}
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
                          <button
                            onClick={() => setShowPostMenu(showPostMenu === post.id ? null : post.id)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </button>

                          {/* Dropdown Menu */}
                          {showPostMenu === post.id && (
                            <div className="absolute right-0 top-8 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
                              {isCurrentUserPost(post.author.name) ? (
                                <>
                                  <button
                                    onClick={() => handleEditPost(post.id, post.content)}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                                  >
                                    <Edit className="w-4 h-4" />
                                    <span>Chỉnh sửa bài viết</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeletePost(post.id)}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-red-600"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    <span>Xóa bài viết</span>
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    onClick={() => handleReportPost(post.id)}
                                    className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-red-600"
                                  >
                                    <Flag className="w-4 h-4" />
                                    <span>Báo cáo bài viết</span>
                                  </button>
                                </>
                              )}
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
                        <div className="space-y-3">
                          <textarea
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={4}
                          />
                          <div className="flex justify-end space-x-2">
                            <button
                              onClick={handleCancelEdit}
                              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                              Hủy
                            </button>
                            <button
                              onClick={() => handleSaveEdit(post.id)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                            >
                              Lưu
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
                        <div className="flex items-center space-x-1">
                          {post.totalReactions > 0 ? (
                            <div className="flex items-center space-x-1 cursor-pointer hover:underline"
                                 onClick={() => handleReactionSummaryClick(post.id)}
                                 onMouseEnter={() => setHoveredPost(post.id)}
                                 onMouseLeave={() => setHoveredPost(null)}>
                              <span className="text-lg">{getReactionSummaryText(post)}</span>
                              <span>{post.totalReactions}</span>
                              
                              {/* Reaction tooltip on hover */}
                              {hoveredPost === post.id && (
                                <div className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-3 mt-8 min-w-48">
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
                            </div>
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
                            onClick={() => handleReaction(post.id, 'Like')}
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
                            const input = document.querySelector(`input[placeholder="Viết bình luận..."]`) as HTMLInputElement;
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
              <div className="w-80 space-y-6 hidden lg:block">
                {/* About Section */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-gray-900">Giới thiệu</h3>
                    <button className="text-gray-400 hover:text-gray-600 p-1">
                      <Edit className="w-4 h-4" />
                    </button>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    Cộng đồng Xoá mù YT cho người mới, nơi để chia sẻ kinh nghiệm, tài liệu,
                    hỏi đáp và học tập cho tất cả mọi người!
                  </p>
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="w-4 h-4 mr-2" />
                      <span className="font-medium">Công khai</span>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">
                      Bất kỳ ai cũng có thể nhìn thấy mọi người trong nhóm và những gì họ đăng.
                    </p>
                    <div className="flex items-center text-sm text-gray-600">
                      <Eye className="w-4 h-4 mr-2" />
                      <span className="font-medium">Hiển thị</span>
                    </div>
                    <p className="text-xs text-gray-500 ml-6">
                      Ai cũng có thể tìm thấy nhóm này.
                    </p>
                  </div>
                </div>

                {/* Group Information Sections */}
                <div className="border-b border-gray-200 pb-6 space-y-6">

                  {/* Community Rules Section */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-gray-900">Quy tắc cộng đồng</h5>
                      <button className="text-gray-400 hover:text-gray-600 p-1">
                        <Edit className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-gray-600 text-sm">
                      Thêm quy tắc để giúp duy trì môi trường thảo luận tích cực và tôn trọng trong nhóm gia phả.
                    </p>
                  </div>

                  {/* Recent Activity */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Hoạt động gần đây</h3>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src="https://images.unsplash.com/photo-1494790108755-2616b612b048?w=40&h=40&fit=crop&crop=face"
                          alt="User"
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">
                            <span className="font-medium">Mai Lan</span> đã bình luận về bài viết của bạn
                          </p>
                          <p className="text-xs text-gray-500">5 phút trước</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <img
                          src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face"
                          alt="User"
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">
                            <span className="font-medium">Trung Hiếu</span> đã thích bài viết về gia phả
                          </p>
                          <p className="text-xs text-gray-500">1 giờ trước</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <img
                          src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=40&h=40&fit=crop&crop=face"
                          alt="User"
                          className="w-8 h-8 rounded-full"
                        />
                        <div className="flex-1">
                          <p className="text-sm text-gray-800">
                            <span className="font-medium">Đức Thắng</span> đã chia sẻ ảnh gia đình
                          </p>
                          <p className="text-xs text-gray-500">3 giờ trước</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Popular Topics */}
                  <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Chủ đề phổ biến</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-800">#gia-pha-viet-nam</span>
                        </div>
                        <span className="text-xs text-gray-500">125 bài viết</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-800">#truyen-thong-gia-dinh</span>
                        </div>
                        <span className="text-xs text-gray-500">89 bài viết</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-800">#tim-hieu-to-tien</span>
                        </div>
                        <span className="text-xs text-gray-500">67 bài viết</span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                          <span className="text-sm font-medium text-gray-800">#luu-tru-tai-lieu</span>
                        </div>
                        <span className="text-xs text-gray-500">45 bài viết</span>
                      </div>
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

          {/* Report Post Modal */}
          {showReportPostModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Báo cáo bài viết</h2>
                    <button
                      onClick={() => setShowReportPostModal(false)}
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
                </div>
              </div>
            </div>
          )}

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
    </div>
  );
};

export default PostPage;