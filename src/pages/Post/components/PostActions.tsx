import React from 'react';
import { MessageCircle } from 'lucide-react';
import type { Post, ReactionType } from '@/types/post';
import ReactionArea from './ReactionArea';

interface PostActionsProps {
  post: Post;
  reactionTypes: ReactionType[];
  showReactionPicker: string | null;
  setShowReactionPicker: (id: string | null) => void;
  onReaction: (postId: string, reactionType: string) => void;
  onCommentClick: () => void;
  isInModal?: boolean;
}

const PostActions: React.FC<PostActionsProps> = ({
  post,
  reactionTypes,
  showReactionPicker,
  setShowReactionPicker,
  onReaction,
  onCommentClick,
  isInModal = false,
}) => {
  return (
    <div className="px-6 py-3 border-t border-gray-200">
      <div className="flex items-center justify-around">
        <ReactionArea
          post={post}
          reactionTypes={reactionTypes}
          showReactionPicker={showReactionPicker}
          setShowReactionPicker={setShowReactionPicker}
          onReaction={onReaction}
        />

        <button
          onClick={onCommentClick}
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
  );
};

export default PostActions;

