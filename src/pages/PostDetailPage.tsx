import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAppSelector } from '../hooks/redux';
import defaultPicture from '@/assets/dashboard/default-avatar.png';
import { MessageCircle, Send, X, ThumbsUp, Edit, Save, XCircle } from 'lucide-react';

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

interface PostDetailPageProps {
  isOpen: boolean;
  post: Post | null;
  onClose: () => void;
  commentInputs: { [key: string]: string };
  setCommentInputs: React.Dispatch<React.SetStateAction<{ [key: string]: string }>>;
  onLikePost: (id: string, type: 'post' | 'comment', postId?: string) => void;
  onCommentSubmit: (postId: string) => void;
  onEditPost?: (postId: string, newContent: string) => void;
  CommentItem: React.FC<{
    comment: Comment;
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
  CommentItem
}) => {
  const { id: groupId } = useParams<{ id: string }>();
  const { user } = useAppSelector(state => state.auth);
  const [isEditingPost, setIsEditingPost] = useState(false);
  const [editContent, setEditContent] = useState('');

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
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-auto max-h-[90vh] overflow-hidden flex">
        {/* Left Side - Post Image (only if images exist) */}
        {post.images && post.images.length > 0 && (
          <div className="flex-1 bg-black flex items-center justify-center min-h-[60vh]">
            <img
              src={post.images[0]}
              alt="Post detail"
              className="max-w-full max-h-full object-contain"
            />
          </div>
        )}

        {/* Right Side - Post Details OR Full Width when no image */}
        <div className={`${post.images && post.images.length > 0 ? 'w-96' : 'w-full max-w-2xl mx-auto'} flex flex-col`}>
          {/* Modal Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="flex items-center space-x-3">
              {/* Show different header based on whether post has images */}
              {post.images && post.images.length > 0 ? (
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
                    {groupId && (
                      <p className="text-xs text-blue-600">Nhóm: {groupId}</p>
                    )}
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
                  {groupId && (
                    <p className="text-xs text-blue-600">Nhóm: {groupId}</p>
                  )}
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

          {/* Group Information Sections */}
          <div className="border-b border-gray-200">
            {/* About Section */}
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-semibold text-gray-900">Giới thiệu</h5>
                <button className="text-gray-400 hover:text-gray-600 p-1">
                  <Edit className="w-4 h-4" />
                </button>
              </div>
              <p className="text-gray-600 text-sm">
                Thêm mô tả về nhóm gia phả này để mọi người hiểu rõ hơn về mục đích và hoạt động của nhóm.
              </p>
            </div>

            {/* Community Rules Section */}
            <div className="p-4">
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
              <button className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-600">
                <MessageCircle className="w-5 h-5" />
                <span className="font-medium">Bình luận</span>
              </button>
            </div>
          </div>

          {/* Comments Section */}
          <div className="flex-1 overflow-y-auto">
            {post.comments.length > 0 && (
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
              <div className="flex-1 flex items-center space-x-2">
                <input
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
                  onClick={() => onCommentSubmit(post.id)}
                  disabled={!commentInputs[post.id]?.trim()}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;
