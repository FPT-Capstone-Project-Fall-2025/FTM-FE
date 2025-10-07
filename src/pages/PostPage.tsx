import React, { useState, useRef } from 'react';
import { useAppSelector } from '../hooks/redux';
import defaultPicture from '@/assets/dashboard/default-avatar.png';
import { MessageCircle, Share2, MoreHorizontal, Send, Image, Smile, X, ThumbsUp, Search, Edit, Trash2, Flag } from 'lucide-react';

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
}

interface Comment {
  id: string;
  author: {
    name: string;
    avatar: string;
  };
  content: string;
  timeAgo: string;
  likes: number;
  isLiked: boolean;
}

const PostPage: React.FC = () => {
  const { user } = useAppSelector(state => state.auth);
  const [postContent, setPostContent] = useState('');
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [isPosting, setIsPosting] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({});
  const [showSearchPopup, setShowSearchPopup] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [showPostMenu, setShowPostMenu] = useState<string | null>(null);
  const [showCommentMenu, setShowCommentMenu] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportingCommentId, setReportingCommentId] = useState<string | null>(null);
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
          isLiked: false
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
          content: 'Thật là ý nghĩa! Những câu chuyện từ ông bà là kho báu vô giá.',
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
          name: user?.name || 'Người dùng',
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
    }, 1000);
  };

  const handleLikePost = (postId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { 
            ...post, 
            isLiked: !post.isLiked,
            likes: post.isLiked ? post.likes - 1 : post.likes + 1
          }
        : post
    ));
  };

  const handleLikeComment = (postId: string, commentId: string) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? {
            ...post,
            comments: post.comments.map(comment =>
              comment.id === commentId
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
  };

  const handleCommentSubmit = (postId: string) => {
    const commentText = commentInputs[postId]?.trim();
    if (!commentText) return;

    const newComment: Comment = {
      id: `${postId}-${Date.now()}`,
      author: {
        name: user?.name || 'Người dùng',
        avatar: defaultPicture
      },
      content: commentText,
      timeAgo: 'Vừa xong',
      likes: 0,
      isLiked: false
    };

    setPosts(prev => prev.map(post =>
      post.id === postId
        ? { ...post, comments: [...post.comments, newComment] }
        : post
    ));

    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  // New handler functions
  const handleEditPost = (postId: string, content: string) => {
    setEditingPostId(postId);
    setEditContent(content);
    setShowPostMenu(null);
  };

  const handleSaveEdit = (postId: string) => {
    setPosts(prev => prev.map(post =>
      post.id === postId ? { ...post, content: editContent } : post
    ));
    setEditingPostId(null);
    setEditContent('');
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

  const isCurrentUserPost = (authorName: string) => {
    return user?.name === authorName;
  };

  return (
    <div className="h-full bg-gray-50">
      <div className="h-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              DIỄN ĐÀN GIA PHẢ
            </h1>
            <p className="text-gray-600">
              Chia sẻ và thảo luận về gia phả, truyền thống gia đình
            </p>
          </div>
          <button
            onClick={() => setShowSearchPopup(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <Search className="w-5 h-5" />
            <span>Tìm kiếm</span>
          </button>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Create Post */}
          <div className="bg-white shadow-sm rounded-lg border border-gray-200">
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <img
                  src={defaultPicture}
                  alt="Your avatar"
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = defaultPicture;
                  }}
                />
                <div className="flex-1">
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Bạn đang nghĩ gì về gia phả của mình?"
                    className="w-full p-4 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                  
                  {/* Image Previews */}
                  {imagePreviews.length > 0 && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
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
                  )}

                  {/* Post Actions */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center space-x-4">
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
                        className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors"
                      >
                        <Image className="w-5 h-5" />
                        <span className="text-sm font-medium">Ảnh</span>
                      </button>
                      <button className="flex items-center space-x-2 text-gray-600 hover:text-blue-600 transition-colors">
                        <Smile className="w-5 h-5" />
                        <span className="text-sm font-medium">Cảm xúc</span>
                      </button>
                    </div>
                    
                    <button
                      onClick={handleCreatePost}
                      disabled={isPosting || (!postContent.trim() && selectedImages.length === 0)}
                      className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-600/50 text-white font-semibold rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    >
                      {isPosting ? 'ĐANG ĐĂNG...' : 'ĐĂNG BÀI'}
                    </button>
                  </div>
                </div>
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
                      <p className="text-sm text-gray-500">{post.author.timeAgo}</p>
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
                          <button
                            onClick={() => {
                              alert('Báo cáo bài viết đã được gửi!');
                              setShowPostMenu(null);
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-gray-100 flex items-center space-x-2 text-red-600"
                          >
                            <Flag className="w-4 h-4" />
                            <span>Báo cáo bài viết</span>
                          </button>
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
                        className="w-full h-64 object-cover rounded-lg"
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
                    onClick={() => handleLikePost(post.id)}
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
                  <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
                    <Share2 className="w-5 h-5" />
                    <span className="font-medium">Chia sẻ</span>
                  </button>
                </div>
              </div>

              {/* Comments Section */}
              {post.comments.length > 0 && (
                <div className="px-6 pb-4 border-t border-gray-200">
                  <div className="space-y-4 mt-4">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="flex items-start space-x-3">
                        <img
                          src={comment.author.avatar}
                          alt={comment.author.name}
                          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = defaultPicture;
                          }}
                        />
                        <div className="flex-1">
                          <div className="bg-gray-100 rounded-lg px-4 py-2">
                            <p className="font-semibold text-sm text-gray-900">{comment.author.name}</p>
                            <p className="text-gray-900">{comment.content}</p>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <button
                                onClick={() => handleLikeComment(post.id, comment.id)}
                                className={`hover:underline ${comment.isLiked ? 'text-blue-600 font-semibold' : ''}`}
                              >
                                Thích
                              </button>
                              <button className="hover:underline">
                                Phả hồi
                              </button>
                              <span>{comment.timeAgo}</span>
                              {comment.likes > 0 && (
                                <span className="flex items-center space-x-1">
                                  <ThumbsUp className="w-3 h-3 text-blue-600" />
                                  <span>{comment.likes}</span>
                                </span>
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
                        </div>
                      </div>
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
                      <button
                        onClick={() => handleCommentSubmit(post.id)}
                        disabled={!commentInputs[post.id]?.trim()}
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
      </div>
    </div>
  );
};

export default PostPage;