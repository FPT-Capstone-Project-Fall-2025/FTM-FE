// Shared types for Post components

export interface PostAttachment {
  id: string;
  fileUrl: string;
  fileType: number; // 0 = Image, 1 = Video
  caption?: string;
  createdOn?: string;
}

export interface Post {
  id: string;
  title?: string;
  gpMemberId: string;
  author: {
    name: string;
    avatar: string;
    timeAgo: string;
  };
  content: string;
  images?: string[]; // Deprecated: kept for backward compatibility
  attachments?: PostAttachment[]; // New: full attachment info with type
  likes: number;
  comments: Comment[];
  isLiked: boolean;
  isEdited?: boolean;
  editedAt?: string;
  totalReactions: number;
  totalComments?: number; // Total comments count from API
  reactionsSummary: { [key: string]: number };
  userReaction?: string | null;
  userReactionId?: string | null; // ID of the user's reaction for deletion
  status?: number; // Privacy status: 1 = public, 0 = private
}

export interface Comment {
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

export interface ReactionType {
  type: string;
  id: number;
  emoji: string;
  label: string;
}

export interface CreatePostData {
  GPId: string;
  Title?: string;
  Content: string;
  GPMemberId: string;
  Status: number;
  Files?: File[];
  Captions?: string[];
  FileTypes?: string[];
}
