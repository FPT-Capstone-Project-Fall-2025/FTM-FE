import { useState, useEffect } from 'react';
import familyTreeMemberService, { type GPMember } from '../services/familyTreeMemberService';

interface UseGPMemberResult {
  gpMemberId: string | null;
  gpMember: GPMember | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  clearCache: () => void;
}

/**
 * Custom hook to get and manage GPMemberId
 */
export const useGPMember = (gpId: string | null, userId: string | null): UseGPMemberResult => {
  const [gpMemberId, setGpMemberId] = useState<string | null>(null);
  const [gpMember, setGpMember] = useState<GPMember | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGPMember = async () => {
    if (!gpId || !userId) {
      console.log('⚠️ useGPMember: Missing gpId or userId', { gpId, userId });
      setError('GPId and UserId are required');
      return;
    }

    console.log('🔄 useGPMember: Fetching GPMember...', { gpId, userId });
    
    setLoading(true);
    setError(null);

    try {
      // First, try to get cached GPMemberId
      const cachedId = familyTreeMemberService.getCachedGPMemberId();
      if (cachedId) {
        console.log('💾 useGPMember: Using cached GPMemberId:', cachedId);
        setGpMemberId(cachedId);
      }

      // Get full GPMember information
      console.log('📞 useGPMember: Calling getGPMemberByUserId...');
      const member = await familyTreeMemberService.getGPMemberByUserId(gpId, userId);
      
      console.log('📬 useGPMember: Received member:', member);
      
      if (member) {
        console.log('✅ useGPMember: Setting GPMember state', {
          id: member.id,
          fullname: member.fullname,
          ftMemberFilesCount: member.ftMemberFiles?.length || 0
        });
        setGpMember(member);
        setGpMemberId(member.id);
        // Ensure it's cached
        familyTreeMemberService.setGPMemberId(gpId, userId, member.id);
      } else {
        console.error('❌ useGPMember: No member data returned');
        setError('Không thể lấy thông tin thành viên gia phả');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định';
      console.error('❌ useGPMember: Error:', err);
      setError(errorMessage);
    } finally {
      setLoading(false);
      console.log('🏁 useGPMember: Fetch completed');
    }
  };

  const clearCache = () => {
    familyTreeMemberService.clearGPMemberIdCache();
    setGpMemberId(null);
    setGpMember(null);
    setError(null);
  };

  useEffect(() => {
    if (gpId && userId) {
      fetchGPMember();
    } else {
      // Clear state if required parameters are not provided
      setGpMemberId(null);
      setGpMember(null);
      setLoading(false);
      setError(null);
    }
  }, [gpId, userId]);

  return {
    gpMemberId,
    gpMember,
    loading,
    error,
    refetch: fetchGPMember,
    clearCache
  };
};

/**
 * Simpler hook that only returns GPMemberId
 */
export const useGPMemberId = (gpId: string | null, userId: string | null) => {
  const [gpMemberId, setGpMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGPMemberId = async () => {
    if (!gpId || !userId) {
      setError('GPId and UserId are required');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const id = await familyTreeMemberService.getGPMemberIdByUserId(gpId, userId);
      setGpMemberId(id);
      
      if (!id) {
        setError('Không thể lấy GPMemberId');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Đã xảy ra lỗi không xác định';
      setError(errorMessage);
      console.error('Error in useGPMemberId:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gpId && userId) {
      fetchGPMemberId();
    } else {
      setGpMemberId(null);
      setLoading(false);
      setError(null);
    }
  }, [gpId, userId]);

  return {
    gpMemberId,
    loading,
    error,
    refetch: fetchGPMemberId
  };
};