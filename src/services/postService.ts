import type { ApiResponse } from '../types/api';
import api from './apiService';

export interface PostData {
  id: string;
  title: string;
  content: string;
  FTId: string;
  FTMemberId: string;
  gpMemberId?: string | null;
  authorName: string;
  authorPicture: string;
  status: number;
  approvedAt: string | null;
  approvedBy: string | null;
  createdOn: string;
  lastModifiedOn: string;
  totalComments: number;
  totalReactions: number;
  reactionsSummary: Record<string, any>;
  attachments: Array<{
    id: string;
    url: string;
    fileUrl?: string;
    type: string;
    caption?: string;
  }>;
  comments: any[];
  // Legacy/compatibility fields
  createdAt?: string;
  lastModifiedAt?: string;
  createdBy?: string;
  lastModifiedBy?: string;
  author?: {
    name: string;
    avatar: string;
  };
  images?: string[];
  files?: Array<{
    url: string;
    type: string;
    caption?: string;
  }>;
  likes?: number;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
}

export interface CreatePostData {
  FTId: string;
  Title: string;
  Content: string;
  FTMemberId: string;
  Status: number;
  Files?: File[] | undefined;
  Captions?: string[] | undefined;
  FileTypes?: string[] | undefined;
}

const postService = {
  // Get all posts for a specific family tree
  async getPostsByFamilyTree(familyTreeId: string): Promise<ApiResponse<PostData[]>> {
    if (!familyTreeId) {
      throw new Error('familyTreeId is required to fetch posts');
    }

    console.log('[postService.getPostsByFamilyTree] Fetching posts', { FTId: familyTreeId });

    try {
      // Preferred endpoint: query by FTId (new API contract)
      return await api.get(`/post/family-tree/${familyTreeId}`, {
        params: { FTId: familyTreeId },
      });
    } catch (error) {
      console.warn('[postService.getPostsByFamilyTree] /post?FTId failed, fallback to legacy endpoint', error);
      // Fallback to legacy path-based endpoint for backward compatibility
      return api.get(`/post/family-tree/${familyTreeId}`);
    }
  },

  // Create a new post
  createPost(data: CreatePostData): Promise<ApiResponse<PostData>> {
    const formData = new FormData();

    // Add basic post data
    console.log('[postService.createPost] Identifiers', {
      FTId: data.FTId,
      FTMemberId: data.FTMemberId,
    });
    formData.append('FTId', data.FTId);
    formData.append('Title', data.Title);
    formData.append('Content', data.Content);
    formData.append('FTMemberId', data.FTMemberId);
    formData.append('Status', data.Status.toString());

    // Handle files, captions, and file types together
    if (data.Files && data.Files.length > 0) {
      console.log('Processing files:', data.Files.length);
      console.log('Captions provided:', data.Captions?.length || 0);

      // Add files, captions, and file types in sync
      data.Files.forEach((file, index) => {
        // Add file
        formData.append('Files', file);

        // Add caption (empty string if not provided)
        const caption = data.Captions && data.Captions[index] !== undefined ? data.Captions[index] : '';
        formData.append('Captions', caption);

        // Skip FileTypes to avoid validation errors - let API auto-detect
        // API can determine file type from the actual file

        console.log(`File ${index}: ${file.name}, Caption: "${caption}"`);
      });
    }

    // Log the form data for debugging
    console.log('FormData contents:');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }

    // Log detailed FormData structure  
    console.log('Detailed FormData analysis:');
    const formDataEntries = Array.from(formData.entries());
    console.log('FormData entries count:', formDataEntries.length);

    return api.post('/post', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get a specific post by ID
  getPostById(postId: string): Promise<ApiResponse<PostData>> {
    return api.get(`/post/${postId}`);
  },

  // Update a post
  updatePost(postId: string, data: Partial<PostData>): Promise<ApiResponse<PostData>> {
    return api.put(`/post/${postId}`, data);
  },

  // Update post with files (Facebook-style editing)
  updatePostWithFiles(postId: string, data: {
    Title?: string;
    Content?: string;
    Status?: number;
    FTId?: string;
    FTMemberId?: string;
    Files?: File[];
    Captions?: string[];
    FileTypes?: string[];
    RemoveImageIds?: string[]; // IDs of images to remove
    ExistingFileUrls?: string[];
  }): Promise<ApiResponse<PostData>> {
    const formData = new FormData();

    // Add basic post data - Always include these fields even if empty
    formData.append('Title', data.Title || '');
    formData.append('Content', data.Content || '');
    if (data.Status !== undefined) formData.append('Status', data.Status.toString());
    if (data.FTId || data.FTMemberId) {
      console.log('[postService.updatePostWithFiles] Identifiers', {
        FTId: data.FTId,
        FTMemberId: data.FTMemberId,
      });
    }
    if (data.FTId) formData.append('FTId', data.FTId);
    if (data.FTMemberId) formData.append('FTMemberId', data.FTMemberId);

    // Handle files, captions, and file types if provided
    if (data.Files && data.Files.length > 0) {
      console.log('Processing files for update:', data.Files.length);

      data.Files.forEach((file, index) => {
        formData.append('Files', file);

        const caption = data.Captions && data.Captions[index] !== undefined ? data.Captions[index] : '';
        formData.append('Captions', caption);

        // Skip FileTypes for update to avoid validation errors
        // Let API auto-detect file types from the actual file

        console.log(`Update File ${index}: ${file.name}, Caption: "${caption}"`);
      });
    }

    // Handle image removal
    if (data.RemoveImageIds && data.RemoveImageIds.length > 0) {
      data.RemoveImageIds.forEach(imageId => {
        formData.append('RemoveImageIds', imageId);
      });
      console.log('Images to remove:', data.RemoveImageIds);
    }

    if (data.ExistingFileUrls && data.ExistingFileUrls.length > 0) {
      data.ExistingFileUrls.forEach(url => {
        formData.append('ExistingFileUrls', url);
      });
      console.log('Existing images to keep:', data.ExistingFileUrls);
    }

    // Log the form data for debugging
    console.log('Update FormData contents:');
    for (let pair of formData.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }

    return api.put(`/post/${postId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Delete a post
  deletePost(postId: string): Promise<ApiResponse<boolean>> {
    return api.delete(`/post/${postId}`);
  },

  // Like/unlike a post
  likePost(postId: string): Promise<ApiResponse<boolean>> {
    return api.post(`/post/${postId}/like`);
  },

  // Get comments for a post
  getComments(postId: string): Promise<ApiResponse<any[]>> {
    return api.get(`/post/${postId}/comments`);
  },

  // Add a comment to a post or reply to a comment
  addComment(data: {
    postId: string;
    FTMemberId: string;
    content: string;
    parentCommentId?: string;
    files?: File[];
  }): Promise<ApiResponse<any>> {
    const payload = {
      postId: data.postId,
      FTMemberId: data.FTMemberId,
      content: data.content,
      parentCommentId: data.parentCommentId || null
    };

    console.log('Adding comment with payload:', payload);

    return api.post('/post/comments', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // Get replies for a specific comment (removed - now handled by addComment with parentCommentId)

  // Add a reply to a comment (removed - now handled by addComment with parentCommentId)

  // Edit a comment or reply
  editComment(commentId: string, content: string): Promise<ApiResponse<any>> {
    const payload = {
      id: commentId,
      content: content
    };

    console.log('Editing comment with payload:', payload);

    return api.put(`/post/comments/${commentId}`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // Delete a comment or reply
  deleteComment(commentId: string): Promise<ApiResponse<any>> {
    console.log('Deleting comment:', commentId);
    return api.delete(`/post/comments/${commentId}`);
  },

  // Get reactions for a post
  getPostReactions(postId: string): Promise<ApiResponse<any[]>> {
    return api.get(`/post/${postId}/reactions`);
  },

  // Get reaction summary for a post
  getPostReactionSummary(postId: string): Promise<ApiResponse<{ [key: string]: number }>> {
    return api.get(`/post/${postId}/reactions/summary`);
  },

  // Add/toggle reaction to a post
  addPostReaction(data: {
    postId: string;
    FTMemberId: string;
    reactionType: number; // 1=Like, 2=Love, 3=Haha, 4=Wow, 5=Sad, 6=Angry
  }): Promise<ApiResponse<any>> {
    const payload = {
      postId: data.postId,
      FTMemberId: data.FTMemberId,
      reactionType: data.reactionType
    };

    console.log('Adding post reaction with payload:', payload);

    return api.post('/post/reactions', payload, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // Remove reaction from a post
  removePostReaction(reactionId: string): Promise<ApiResponse<any>> {
    console.log('Removing post reaction with reactionId:', reactionId);
    return api.delete(`/post/reactions/${reactionId}`);
  },

  // Update a comment
  updateComment(commentId: string, data: { content: string }): Promise<ApiResponse<any>> {
    return api.put(`/post/comments/${commentId}`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },

  // Report a comment
  reportComment(commentId: string, reason: string): Promise<ApiResponse<any>> {
    return api.post(`/post/comments/${commentId}/report`, { reason }, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
  },
};

export default postService;