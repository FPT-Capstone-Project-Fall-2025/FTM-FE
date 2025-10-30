import React from 'react';
import type { Post, ReactionType } from '@/types/post';

interface PostStatsProps {
  post: Post;
  reactionTypes: ReactionType[];
  hoveredPost: string | null;
  setHoveredPost: (id: string | null) => void;
  tooltipShowTime: React.MutableRefObject<{ [postId: string]: number }>;
  isHoveringReactionPicker: React.MutableRefObject<{ [postId: string]: boolean }>;
  getReactionSummaryText: (post: Post) => string;
  onReactionSummaryClick: (postId: string) => void;
}

const PostStats: React.FC<PostStatsProps> = ({
  post,
  reactionTypes,
  hoveredPost,
  setHoveredPost,
  tooltipShowTime,
  isHoveringReactionPicker,
  getReactionSummaryText,
  onReactionSummaryClick,
}) => {
  const handleMouseEnter = () => {
    setHoveredPost(post.id);
    tooltipShowTime.current[post.id] = Date.now();
  };

  const handleMouseLeave = () => {
    // Don't close if hovering over reaction picker
    if (isHoveringReactionPicker.current[post.id]) {
      return;
    }

    const showTime = tooltipShowTime.current[post.id];
    if (!showTime) {
      setHoveredPost(null);
      return;
    }

    const elapsed = Date.now() - showTime;
    const minDisplayTime = 2000; // 2 seconds minimum
    const remainingTime = Math.max(0, minDisplayTime - elapsed);

    setTimeout(() => {
      // Double check not hovering reaction picker
      if (!isHoveringReactionPicker.current[post.id]) {
        setHoveredPost(null);
        delete tooltipShowTime.current[post.id];
      }
    }, remainingTime);
  };

  return (
    <div className="px-6 py-3 border-t border-gray-200">
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-1">
          {post.totalReactions > 0 ? (
            <div
              className="flex items-center space-x-1 cursor-pointer hover:underline relative"
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
            >
              <div onClick={() => onReactionSummaryClick(post.id)}>
                <span className="text-lg">{getReactionSummaryText(post)}</span>
                <span className="ml-1">{post.totalReactions}</span>
              </div>

              {/* Reaction tooltip dropdown */}
              {hoveredPost === post.id && (
                <div
                  className="absolute left-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-3 min-w-[200px] z-[9999]"
                  style={{ pointerEvents: 'auto' }}
                  onMouseEnter={handleMouseEnter}
                  onMouseLeave={handleMouseLeave}
                >
                  <div className="space-y-1 text-sm">
                    {Object.entries(post.reactionsSummary)
                      .sort((a, b) => b[1] - a[1])
                      .map(([type, count]) => {
                        const reactionEmoji = reactionTypes.find(r => r.type.toLowerCase() === type.toLowerCase())?.emoji || '👍';
                        const reactionLabel = reactionTypes.find(r => r.type.toLowerCase() === type.toLowerCase())?.label || type;
                        return (
                          <button
                            key={type}
                            onClick={(e) => {
                              e.stopPropagation();
                              onReactionSummaryClick(post.id);
                            }}
                            className="w-full flex items-center justify-between hover:bg-gray-50 px-3 py-2 rounded transition-colors cursor-pointer"
                          >
                            <span className="flex items-center space-x-2">
                              <span className="text-lg">{reactionEmoji}</span>
                              <span className="text-gray-700">{reactionLabel}</span>
                            </span>
                            <span className="font-semibold text-blue-600">{count}</span>
                          </button>
                        );
                      })}
                  </div>
                  <div className="mt-2 pt-2 border-t border-gray-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onReactionSummaryClick(post.id);
                      }}
                      className="w-full text-center text-xs text-blue-600 hover:text-blue-700 font-medium py-1"
                    >
                      Xem tất cả →
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <span>Hãy là người tương tác đầu tiên</span>
          )}
        </div>
        <div>
          {(post.totalComments ?? post.comments.length) > 0 && (
            <span>{post.totalComments ?? post.comments.length} bình luận</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostStats;

