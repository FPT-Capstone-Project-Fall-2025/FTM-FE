import React, { useState, useRef } from 'react';
import { useAppSelector } from '../hooks/redux';
import defaultPicture from '@/assets/dashboard/default-avatar.png';
import { MessageCircle, MoreHorizontal, Send, Image, Smile, X, ThumbsUp, Search, Edit, Trash2, Flag, Users, Eye, Globe, Settings, Share, Plus } from 'lucide-react';
import PostDetailPage from './PostDetailPage';

interface Post {
  id: string;
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
}

interface Comment {
  id: string;
  author: {
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
  const { user } = useAppSelector(state => state.auth);
  const [postContent, setPostContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [commentImages, setCommentImages] = useState<{ [key: string]: File[] }>({});
  const [commentImagePreviews, setCommentImagePreviews] = useState<{ [key: string]: string[] }>({});
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [showSharePopup, setShowSharePopup] = useState(false);
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

  // Mock posts data
  const [posts, setPosts] = useState<Post[]>([
    {
      id: '1',
      author: {
        name: 'Nguyễn Văn An',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        timeAgo: '2 giờ trước'
      },
      content: 'Mình vừa tìm được thông tin về tổ tiên đời thứ 8 của gia đình. Rất vui mừng và xúc động khi khám phá được nguồn gốc gia phả của mình. Có ai cũng đang nghiên cứu về gia phả họ Nguyễn không ạ?',
      images: ['https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=600&h=400&fit=crop'],
      likes: 24,
      isLiked: false,
      comments: [
        {
          id: '1-1',
          author: {
            name: 'Trần Thị Bình',
            avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face'
          },
          content: 'Tuyệt vời quá! Mình cũng đang tìm hiểu về dòng họ Trần. Có thể chia sẻ kinh nghiệm không ạ?',
          timeAgo: '1 giờ trước',
          likes: 3,
          isLiked: false,
          replies: [
            {
              id: '1-1-1',
              author: {
                name: 'Nguyễn Văn An',
                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
              },
              content: 'Chào chị Bình! Mình rất sẵn lòng chia sẻ. Có thể liên hệ qua tin nhắn riêng không ạ?',
              timeAgo: '45 phút trước',
              likes: 1,
              isLiked: false
            },
            {
              id: '1-1-2',
              author: {
                name: 'Phạm Văn Đức',
                avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
              },
              content: 'Mình cũng quan tâm đến chủ đề này. Cho mình tham gia thảo luận được không ạ?',
              timeAgo: '30 phút trước',
              likes: 2,
              isLiked: true
            }
          ]
        }
      ]
    },
    {
      id: '2',
      author: {
        name: 'Lê Minh Hoàng',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
        timeAgo: '5 giờ trước'
      },
      content: 'Hôm nay về quê và được nghe ông nội kể về những câu chuyện xưa. Cảm ơn ứng dụng đã giúp mình ghi chép lại những thông tin quý báu này!',
      likes: 42,
      isLiked: true,
      comments: [
        {
          id: '2-1',
          author: {
            name: 'Phạm Thị Mai',
            avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
          },
          content: 'Thật là ý nghĩa! Những câu chuyện từ ông bà là kho báu vô giá. Đây là một số tài liệu về gia phả mà gia đình mình lưu giữ:',
          images: [
            'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300&h=200&fit=crop',
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=200&fit=crop'
          ],
          timeAgo: '3 giờ trước',
          likes: 5,
          isLiked: true
        },
        {
          id: '2-2',
          author: {
            name: 'Vũ Đức Thắng',
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face'
          },
          content: 'Mình cũng nên về quê hỏi ông bà nhiều hơn. Cảm ơn bạn đã nhắc nhở!',
          timeAgo: '2 giờ trước',
          likes: 2,
          isLiked: false
        }
      ]
    }
  ]);

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
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        alert(`File ${file.name} không đúng định dạng. Chỉ chấp nhận JPEG, JPG, PNG, GIF`);
        return false;
      }
      return true;
    });

    setSelectedImages(prev => [...prev, ...validFiles]);

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
  };

  const handleCreatePost = async () => {
    if (!postContent.trim() && selectedImages.length === 0) {
      alert('Vui lòng nhập nội dung hoặc chọn ảnh');
      return;
    }

    setIsPosting(true);
    
    // Simulate API call
    setTimeout(() => {
      const newPost: Post = {
        id: Date.now().toString(),
        author: {
          name: user?.name || 'Username',
          avatar: defaultPicture,
          timeAgo: 'Vừa xong'
        },
        content: postContent,
        images: imagePreviews,
        likes: 0,
        isLiked: false,
        comments: []
      };

      setPosts(prev => [newPost, ...prev]);
      setPostContent('');
      setSelectedImages([]);
      setImagePreviews([]);
      setIsPosting(false);
      setShowCreatePostModal(false); // Close modal after successful post
    }, 1000);
  };

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

  const handleCommentSubmit = (postId: string) => {
    const commentText = commentInputs[postId]?.trim();
    const images = commentImagePreviews[postId] || [];
    
    if (!commentText && images.length === 0) return;

    const newComment: Comment = {
      id: `${postId}-${Date.now()}`,
      author: {
        name: user?.name || 'Người dùng',
        avatar: defaultPicture
      },
      content: commentText || '',
      ...(images.length > 0 && { images }),
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
  };

  // New handler functions
  const handleEditPost = (postId: string, content: string) => {
    setEditingPostId(postId);
    setEditContent(content);
    setShowPostMenu(null);
  };

  const handleSaveEdit = (postId: string) => {
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
  };

  // Copy link function
  const handleCopyLink = async () => {
    try {
      const groupUrl = `${window.location.origin}/group/gia-pha-gia-dinh-nguyen`;
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

  const handleCancelEdit = () => {
    setEditingPostId(null);
    setEditContent('');
  };

  const handleDeletePost = (postId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      setPosts(prev => prev.filter(post => post.id !== postId));
    }
    setShowPostMenu(null);
  };

  const handleReportComment = (commentId: string) => {
    setReportingCommentId(commentId);
    setShowReportModal(true);
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
      const filteredPosts = posts.filter(post =>
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
      console.log('Search results:', filteredPosts);
      // TODO: Display filtered results
    }
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

  const handleReplySubmit = (postId: string, parentCommentId: string) => {
    const replyText = replyInputs[parentCommentId]?.trim();
    if (!replyText) return;

    const newReply: Comment = {
      id: `${parentCommentId}-reply-${Date.now()}`,
      author: {
        name: user?.name || 'Người dùng',
        avatar: defaultPicture
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
  };

  const handleOpenPostDetail = (post: Post) => {
    setSelectedPost(post);
    setShowPostDetail(true);
  };

  const isCurrentUserPost = (authorName: string) => {
    return user?.name === authorName;
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
            src={comment.author.avatar}
            alt={comment.author.name}
            className="w-8 h-8 rounded-full object-cover flex-shrink-0 relative z-10 bg-white"
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultPicture;
            }}
          />
          <div className="flex-1">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <p className="font-semibold text-sm text-gray-900">{comment.author.name}</p>
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
                    <button
                      onClick={() => handleReportComment(comment.id)}
                      className="w-full px-3 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-red-600 text-xs"
                    >
                      <Flag className="w-3 h-3" />
                      <span>Báo cáo bình luận</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Reply Input */}
            {replyingToComment === comment.id && canReply && (
              <div className="mt-3">
                <div className="flex items-center space-x-2">
                  <img
                    src={defaultPicture}
                    alt="Your avatar"
                    className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = defaultPicture;
                    }}
                  />
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
              src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=1200&h=400&fit=crop"
              alt="Group cover"
              className="w-full h-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-black/30"></div>
          </div>

          {/* Group Info */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto">
              <div className="flex items-end justify-between pb-6 mt-4">
                <div className="flex items-end space-x-6">
                  {/* Group Details */}
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                      Gia Phả Gia Đình Nguyễn
                    </h1>
                    <div className="flex items-center space-x-4 text-gray-600 mb-2">
                      <span className="text-sm font-medium">28.3K thành viên</span>
                    </div>

                    {/* Member Avatars */}
                    <div className="flex items-center space-x-1">
                      <div className="flex -space-x-1">
                        {[
                          'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=32&h=32&fit=crop&crop=face',
                          'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face',
                          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=32&h=32&fit=crop&crop=face',
                          'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=32&h=32&fit=crop&crop=face',
                          'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=32&h=32&fit=crop&crop=face'
                        ].map((avatar, index) => (
                          <img
                            key={index}
                            src={avatar}
                            alt={`Member ${index + 1}`}
                            className="w-6 h-6 rounded-full border-2 border-white object-cover"
                          />
                        ))}
                      </div>
                      <span className="text-xs text-gray-500 ml-2">
                        <span className="font-medium">Trần Thị Bình</span> và {Math.floor(Math.random() * 10) + 5} người khác là bạn bè của bạn
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
                    <img
                      src={defaultPicture}
                      alt="Your avatar"
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = defaultPicture;
                      }}
                    />
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

          {/* Posts Feed */}
          {posts.map((post) => (
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
                              onClick={() => handleEditPost(post.id, post.content)}
                              className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2"
                            >
                              <Edit className="w-4 h-4" />
                              <span>Chỉnh sửa bài viết</span>
                            </button>
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
              <div className="px-6 py-3 border-t border-gray-200">
                <div className="flex items-center justify-around">
                  <button
                    onClick={() => handleLike(post.id, 'post')}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors ${
                      post.isLiked ? 'text-blue-600' : 'text-gray-600'
                    }`}
                  >
                    <ThumbsUp className={`w-5 h-5 ${post.isLiked ? 'fill-current' : ''}`} />
                    <span className="font-medium">Thích</span>
                  </button>
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
                  <img
                    src={defaultPicture}
                    alt="Your avatar"
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = defaultPicture;
                    }}
                  />
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
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                  Giới thiệu
                </h3>
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

              {/* Community Guidelines */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quy tắc cộng đồng</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Tôn trọng và lịch sự với tất cả thành viên</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Chia sẻ nội dung phù hợp và có giá trị</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Không spam hay quảng cáo không mong muốn</p>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p>Bảo vệ thông tin cá nhân và riêng tư</p>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Thống kê</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">1,234</div>
                    <div className="text-xs text-gray-600">Thành viên</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">567</div>
                    <div className="text-xs text-gray-600">Bài viết</div>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600">89</div>
                    <div className="text-xs text-gray-600">Hoạt động hôm nay</div>
                  </div>
                  <div className="text-center p-3 bg-orange-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600">23</div>
                    <div className="text-xs text-gray-600">Thành viên mới</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search Popup */}
        {showSearchPopup && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
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
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Nhập từ khóa tìm kiếm..."
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleSearchPosts();
                      }
                    }}
                  />
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowSearchPopup(false)}
                      className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleSearchPosts}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                    >
                      Tìm kiếm
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
                        src="https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?w=60&h=60&fit=crop"
                        alt="Group"
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900">Gia Phả Gia Đình Nguyễn</h3>
                        <p className="text-sm text-gray-600">Nhóm công khai • 28.3K thành viên</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 bg-white rounded-lg p-3 border">
                      <span className="flex-1 text-sm text-gray-600 truncate">
                        {window.location.origin}/group/gia-pha-gia-dinh-nguyen
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
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Tạo bài viết</h2>
                <button
                  onClick={() => setShowCreatePostModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* User Info */}
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <img
                    src={defaultPicture}
                    alt="Your avatar"
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = defaultPicture;
                    }}
                  />
                  <div>
                    <p className="font-semibold text-gray-900">{user?.name || 'Username'}</p>
                  </div>
                </div>
              </div>

              {/* Post Content */}
              <div className="p-4">
                <textarea
                  value={postContent}
                  onChange={(e) => setPostContent(e.target.value)}
                  placeholder="Bạn đang nghĩ gì?"
                  className="w-full p-3 resize-none border-none focus:outline-none text-lg"
                  rows={4}
                  style={{ minHeight: '120px' }}
                />

                {/* Image Previews */}
                {imagePreviews.length > 0 && (
                  <div className="mt-4 border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 gap-2">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative">
                          <img
                            src={preview}
                            alt={`Preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg"
                          />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 hover:bg-opacity-70"
                          >
                            <X className="w-4 h-4" />
                          </button>
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
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-8 h-8 bg-green-100 hover:bg-green-200 rounded-full flex items-center justify-center transition-colors"
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