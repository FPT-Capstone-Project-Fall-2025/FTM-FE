import React, { useState } from 'react';
import { Send, Smile, X } from 'lucide-react';
import defaultPicture from '@/assets/dashboard/default-avatar.png';

interface CommentInputProps {
  postId: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  userAvatar?: string;
  placeholder?: string;
}

// Common emojis list
const commonEmojis = [
  '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
  '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
  '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫', '🤔',
  '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬', '🤥',
  '😌', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮',
  '🤧', '🥵', '🥶', '😵', '🤯', '🤠', '🥳', '😎', '🤓', '🧐',
  '😕', '😟', '🙁', '☹️', '😮', '😯', '😲', '😳', '🥺', '😦',
  '😧', '😨', '😰', '😥', '😢', '😭', '😱', '😖', '😣', '😞',
  '😓', '😩', '😫', '🥱', '😤', '😡', '😠', '🤬', '👍', '👎',
  '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✌️', '🤞', '🤟', '🤘',
  '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
  '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '🎉', '🎊'
];

const CommentInput: React.FC<CommentInputProps> = ({
  postId,
  value,
  onChange,
  onSubmit,
  userAvatar = defaultPicture,
  placeholder = 'Viết bình luận...',
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const handleEmojiSelect = (emoji: string) => {
    onChange(value + emoji);
    setShowEmojiPicker(false);
    
    // Focus back on the input
    const input = document.querySelector(`#comment-input-${postId}`) as HTMLInputElement;
    if (input) input.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      onSubmit();
    }
  };

  return (
    <div className="p-4 border-t border-gray-200">
      <div className="flex items-center space-x-3">
        <img
          src={userAvatar}
          alt="Your avatar"
          className="w-8 h-8 rounded-full object-cover flex-shrink-0"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultPicture;
          }}
        />
        <div className="flex-1 flex flex-col space-y-2">
          <div className="flex items-center space-x-2 relative">
            <input
              id={`comment-input-${postId}`}
              type="text"
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white focus:border-transparent"
              onKeyPress={handleKeyPress}
            />
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-gray-100 rounded-full transition-colors"
              title="Chọn emoji"
            >
              <Smile className="w-5 h-5" />
            </button>
            <button
              onClick={onSubmit}
              disabled={!value.trim()}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-full disabled:text-gray-400 disabled:hover:bg-transparent transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>

            {/* Emoji Picker Popup */}
            {showEmojiPicker && (
              <div className="absolute bottom-full left-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-xl p-3 z-50 w-80 max-h-64 overflow-y-auto">
                <div className="flex items-center justify-between mb-2 pb-2 border-b border-gray-200">
                  <h4 className="text-sm font-semibold text-gray-900">Chọn emoji</h4>
                  <button
                    onClick={() => setShowEmojiPicker(false)}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="grid grid-cols-8 gap-1">
                  {commonEmojis.map((emoji, index) => (
                    <button
                      key={index}
                      onClick={() => handleEmojiSelect(emoji)}
                      className="text-2xl hover:bg-gray-100 rounded p-1 transition-colors hover:scale-110 transform duration-150"
                      title={emoji}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommentInput;

