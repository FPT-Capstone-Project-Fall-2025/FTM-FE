import React from 'react';
import type { Comment } from '@/types/post';

interface CommentAreaProps {
  comments: Comment[];
  postId: string;
  showComments: boolean;
  loadingComments?: boolean;
  CommentItem: React.FC<{
    comment: Comment;
    postId: string;
    depth?: number;
    maxDepth?: number;
  }>;
}

const CommentArea: React.FC<CommentAreaProps> = ({
  comments,
  postId,
  showComments,
  loadingComments = false,
  CommentItem,
}) => {
  if (loadingComments) {
    return (
      <div className="p-4 flex items-center justify-center">
        <div className="flex items-center space-x-2 text-gray-500">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span>Đang tải bình luận...</span>
        </div>
      </div>
    );
  }

  if (!showComments) {
    return null;
  }

  if (comments.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">
        Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          postId={postId}
        />
      ))}
    </div>
  );
};

export default CommentArea;

