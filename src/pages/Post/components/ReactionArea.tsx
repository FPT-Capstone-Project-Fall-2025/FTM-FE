import React from 'react';
import { ThumbsUp } from 'lucide-react';
import type { Post, ReactionType } from '@/types/post';

interface ReactionAreaProps {
  post: Post;
  reactionTypes: ReactionType[];
  showReactionPicker: string | null;
  setShowReactionPicker: (id: string | null) => void;
  onReaction: (postId: string, reactionType: string) => void;
}

const ReactionArea: React.FC<ReactionAreaProps> = ({
  post,
  reactionTypes,
  showReactionPicker,
  setShowReactionPicker,
  onReaction,
}) => {
  const hoverTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const hideTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    // Clear any pending hide timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    
    // Show picker after a short delay (like Facebook)
    hoverTimeoutRef.current = setTimeout(() => {
      setShowReactionPicker(post.id);
    }, 300);
  };

  const handleMouseLeave = () => {
    // Clear the show timeout if user leaves before picker shows
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    
    // Hide picker after a delay to allow moving to picker
    // Only hide if THIS post's picker is showing
    hideTimeoutRef.current = setTimeout(() => {
      if (showReactionPicker === post.id) {
        setShowReactionPicker(null);
      }
    }, 300);
  };

  const handlePickerMouseEnter = () => {
    // Clear any pending hide timeout when entering picker
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  const handlePickerMouseLeave = () => {
    // Hide picker when mouse leaves
    // Only hide if THIS post's picker is showing
    hideTimeoutRef.current = setTimeout(() => {
      if (showReactionPicker === post.id) {
        setShowReactionPicker(null);
      }
    }, 100);
  };

  const handleQuickReaction = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Clear all timeouts
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    
    // Quick click: toggle user's existing reaction or add Like
    const reactionToToggle = post.userReaction || 'Like';
    onReaction(post.id, reactionToToggle);
    setShowReactionPicker(null);
  };

  const handleReactionSelect = (e: React.MouseEvent, reactionType: string) => {
    e.stopPropagation();
    e.preventDefault();
    
    // Clear all timeouts
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    
    console.log('🎯 Selected reaction:', reactionType);
    onReaction(post.id, reactionType);
    
    // Close picker after selection
    setShowReactionPicker(null);
  };

  // Clear timeouts when another post's picker is shown
  React.useEffect(() => {
    if (showReactionPicker !== null && showReactionPicker !== post.id) {
      // Another post's picker is showing, clear our timeouts
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
        hoverTimeoutRef.current = null;
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
        hideTimeoutRef.current = null;
      }
      // ensure hover state cleared for this component
    }
  }, [showReactionPicker, post.id]);

  // Cleanup timeouts on unmount
  React.useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div 
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        data-reaction-button
        onClick={handleQuickReaction}
        className={`flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors relative ${
          post.userReaction ? 'text-blue-600' : 'text-gray-600'
        }`}
        title={post.userReaction ? 'Nhấp để bỏ tương tác, hover để đổi' : 'Nhấp để thích, hover để chọn'}
      >
        {post.userReaction ? (
          <span className="text-lg">
            {reactionTypes.find(r => r.type === post.userReaction)?.emoji || '👍'}
          </span>
        ) : (
          <ThumbsUp className="w-5 h-5" />
        )}
        <span className={`${post.userReaction ? 'font-bold' : 'font-medium'}`}>
          {post.userReaction ? reactionTypes.find(r => r.type === post.userReaction)?.label : 'Thích'}
        </span>
      </button>

      {/* Reaction Picker - Shows on hover */}
      {showReactionPicker === post.id && (
        <div
          data-reaction-picker
          className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-full shadow-lg p-2 flex space-x-2 z-50"
          onClick={(e) => e.stopPropagation()}
          onMouseEnter={handlePickerMouseEnter}
          onMouseLeave={handlePickerMouseLeave}
        >
          {reactionTypes.map((reaction) => (
            <button
              key={reaction.type}
              onClick={(e) => handleReactionSelect(e, reaction.type)}
              className="text-2xl hover:scale-125 transition-transform duration-200 p-1 rounded-full hover:bg-gray-100"
              title={reaction.label}
            >
              {reaction.emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReactionArea;

