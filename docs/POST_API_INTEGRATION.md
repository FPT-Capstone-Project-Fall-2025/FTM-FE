# Post API Integration

## Overview
The PostPage component has been updated to integrate with the real family tree post API instead of using mock data.

## Key Changes

### 1. Created PostService (`/src/services/postService.ts`)
- `getPostsByFamilyTree(familyTreeId)` - Get all posts for a specific family tree
- `createPost(data)` - Create a new post with file uploads
- `updatePost(postId, data)` - Update existing post
- `deletePost(postId)` - Delete a post
- `likePost(postId)` - Like/unlike a post
- `getComments(postId)` - Get comments for a post
- `addComment(postId, content, images)` - Add comment to a post

### 2. Updated PostPage Component
- **API Integration**: Replaced mock data with real API calls
- **Loading States**: Added skeleton loading and error handling
- **Authentication**: Automatic token handling via existing API service
- **File Uploads**: Support for multiple files with captions and file types
- **URL Parameters**: Support for familyTreeId from URL params with fallback

### 3. Data Transformation
The component transforms API responses to match the existing Post interface:
```typescript
interface Post {
  id: string;
  author: { name: string; avatar: string; timeAgo: string; };
  content: string;
  images?: string[];
  likes: number;
  comments: Comment[];
  isLiked: boolean;
  isEdited?: boolean;
  editedAt?: string;
}
```

### 4. API Endpoints Used
- `GET /api/post/family-tree/{familyTreeId}` - Get posts for family tree
- `POST /api/post` - Create new post (multipart/form-data)

### 5. Authentication
- Uses existing API service with automatic Bearer token injection
- Tokens are managed via Redux persist and axios interceptors

## Usage

### Viewing Posts
Posts are automatically loaded when the component mounts using the familyTreeId from URL params or a fallback ID for testing.

### Creating Posts
Users can create posts with:
- Title (optional)
- Content (required if no images)
- Multiple images/files (up to 4)
- File captions
- Automatic file type detection

### Error Handling
- Network errors are caught and displayed to users
- Loading states prevent multiple submissions
- Proper validation for required fields

## Testing
The component includes a fallback familyTreeId (`822994d5-7acd-41f8-b12b-e0a634d74440`) for testing when no URL parameter is provided.

## Future Enhancements
- Comment API integration
- Like/unlike API integration
- Post editing and deletion API integration
- Real-time updates with WebSocket
- Image/file preview and download
- Post search and filtering