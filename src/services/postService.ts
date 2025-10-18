import type { ApiResponse } from '../types/api';
import api from './apiService';

export interface PostData {
  id: string;
  title: string;
  content: string;
  gpId: string;
  gpMemberId: string;
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
  GPId: string;
  Title: string;
  Content: string;
  GPMemberId: string;
  Status: number;
  Files?: File[] | undefined;
  Captions?: string[] | undefined;
  FileTypes?: string[] | undefined;
}

const postService = {
  // Get all posts for a specific family tree
  getPostsByFamilyTree(familyTreeId: string): Promise<ApiResponse<PostData[]>> {
    return api.get(`/post/family-tree/${familyTreeId}`);
  },

  // Create a new post
  createPost(data: CreatePostData): Promise<ApiResponse<PostData>> {
    const formData = new FormData();
    
    // Add basic post data
    formData.append('GPId', data.GPId);
    formData.append('Title', data.Title);
    formData.append('Content', data.Content);
    formData.append('GPMemberId', data.GPMemberId);
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
    GPId?: string;
    GPMemberId?: string;
    Files?: File[];
    Captions?: string[];
    FileTypes?: string[];
    RemoveImageIds?: string[]; // IDs of images to remove
  }): Promise<ApiResponse<PostData>> {
    const formData = new FormData();
    
    // Add basic post data - Always include these fields even if empty
    formData.append('Title', data.Title || '');
    formData.append('Content', data.Content || '');
    if (data.Status !== undefined) formData.append('Status', data.Status.toString());
    if (data.GPId) formData.append('GPId', data.GPId);
    if (data.GPMemberId) formData.append('GPMemberId', data.GPMemberId);
    
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

  // Add a comment to a post
  addComment(postId: string, content: string, images?: File[]): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('content', content);
    
    if (images && images.length > 0) {
      images.forEach((image) => {
        formData.append('images', image);
      });
    }

    return api.post(`/post/${postId}/comments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // Get replies for a specific comment
  getCommentReplies(commentId: string): Promise<ApiResponse<any[]>> {
    return api.get(`/post/comments/${commentId}/replies`);
  },

  // Add a reply to a comment
  addCommentReply(commentId: string, content: string, images?: File[]): Promise<ApiResponse<any>> {
    const formData = new FormData();
    formData.append('content', content);
    
    if (images && images.length > 0) {
      images.forEach((image) => {
        formData.append('images', image);
      });
    }

    return api.post(`/post/comments/${commentId}/replies`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
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
  addPostReaction(postId: string, reactionType: string): Promise<ApiResponse<any>> {
    return api.post(`/post/${postId}/reactions`, { reactionType });
  },

  // Remove reaction from a post
  removePostReaction(postId: string): Promise<ApiResponse<any>> {
    return api.delete(`/post/${postId}/reactions`);
  },
};

export default postService;