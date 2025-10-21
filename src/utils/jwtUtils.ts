// JWT utility functions for token parsing and user information extraction

export const getUserIdFromToken = (token: string): string | null => {
  try {
    // Remove Bearer prefix if present
    const cleanToken = token.replace('Bearer ', '');
    
    // Split the token and get the payload
    const parts = cleanToken.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT token format');
      return null;
    }

    // Decode the payload (base64)
    const payload = parts[1];
    if (!payload) {
      console.error('Invalid JWT token: missing payload');
      return null;
    }
    const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsedPayload = JSON.parse(decodedPayload);

    // Return the user ID from the 'sub' field
    return parsedPayload.sub || parsedPayload.userId || parsedPayload.id || null;
  } catch (error) {
    console.error('Error parsing JWT token for user ID:', error);
    return null;
  }
};

export const getFullNameFromToken = (token: string): string | null => {
  try {
    // Remove Bearer prefix if present
    const cleanToken = token.replace('Bearer ', '');
    
    // Split the token and get the payload
    const parts = cleanToken.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT token format');
      return null;
    }

    // Decode the payload (base64)
    const payload = parts[1];
    if (!payload) {
      console.error('Invalid JWT token: missing payload');
      return null;
    }
    const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsedPayload = JSON.parse(decodedPayload);

    // Return the full name from the token
    return parsedPayload.fullName || parsedPayload.name || parsedPayload.given_name || null;
  } catch (error) {
    console.error('Error parsing JWT token for full name:', error);
    return null;
  }
};

export const getEmailFromToken = (token: string): string | null => {
  try {
    // Remove Bearer prefix if present
    const cleanToken = token.replace('Bearer ', '');
    
    // Split the token and get the payload
    const parts = cleanToken.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT token format');
      return null;
    }

    // Decode the payload (base64)
    const payload = parts[1];
    if (!payload) {
      return null;
    }
    const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsedPayload = JSON.parse(decodedPayload);

    // Return the email from the token
    return parsedPayload.email || null;
  } catch (error) {
    console.error('Error parsing JWT token for email:', error);
    return null;
  }
};

export const isTokenExpired = (token: string): boolean => {
  try {
    // Remove Bearer prefix if present
    const cleanToken = token.replace('Bearer ', '');
    
    // Split the token and get the payload
    const parts = cleanToken.split('.');
    if (parts.length !== 3) {
      return true;
    }

    // Decode the payload (base64)
    const payload = parts[1];
    if (!payload) {
      return true;
    }
    const decodedPayload = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    const parsedPayload = JSON.parse(decodedPayload);

    // Check if token is expired
    const currentTime = Math.floor(Date.now() / 1000);
    return parsedPayload.exp && parsedPayload.exp < currentTime;
  } catch (error) {
    console.error('Error checking JWT token expiration:', error);
    return true;
  }
};