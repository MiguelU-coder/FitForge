import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_URL = (import.meta as any).env.VITE_API_URL || 'http://localhost:3000/api/v1';

export interface Member {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string;
  phoneNumber?: string;
  role: 'ORG_ADMIN' | 'TRAINER' | 'CLIENT';
  status: 'active' | 'inactive' | 'suspended';
  joinedAt: string;
  organizationId?: string;
  subscription?: {
    planId: string;
    planName: string;
    status: string;
    currentPeriodEnd?: string;
  };
  stats?: {
    totalWorkouts: number;
    completedRoutines: number;
    lastWorkoutAt?: string;
  };
}

interface UseMembersOptions {
  organizationId: string;
  session: any;
  search?: string;
  roleFilter?: string;
  statusFilter?: string;
  limit?: number;
  offset?: number;
}

interface UseMembersReturn {
  members: Member[];
  loading: boolean;
  error: string | null;
  stats: {
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
  };
  refetch: () => Promise<void>;
}

export const useMembers = ({
  organizationId,
  session,
  search = '',
  roleFilter = '',
  statusFilter = '',
  limit = 100,
  offset = 0,
}: UseMembersOptions): UseMembersReturn => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    total: number;
    active: number;
    inactive: number;
    byRole: Record<string, number>;
  }>({
    total: 0,
    active: 0,
    inactive: 0,
    byRole: {},
  });

  const fetchMembers = useCallback(async () => {
    if (!organizationId || !session?.access_token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', limit.toString());
      params.append('offset', offset.toString());
      params.append('includeStats', 'true');
      params.append('includeSubscription', 'true');

      const { data } = await axios.get(
        `${API_URL}/organizations/${organizationId}/members?${params}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      if (data.success) {
        const membersData = data.data.members || [];
        setMembers(membersData);
        setStats(
          data.data.stats || {
            total: membersData.length,
            active: membersData.filter((m: Member) => m.status === 'active').length,
            inactive: membersData.filter((m: Member) => m.status !== 'active').length,
            byRole: membersData.reduce(
              (acc: Record<string, number>, m: Member) => {
                acc[m.role] = (acc[m.role] || 0) + 1;
                return acc;
              },
              {}
            ),
          }
        );
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar miembros');
      console.error('Error fetching members:', err);
    } finally {
      setLoading(false);
    }
  }, [organizationId, session?.access_token, search, roleFilter, statusFilter, limit, offset]);

  useEffect(() => {
    fetchMembers();
  }, [fetchMembers]);

  return {
    members,
    loading,
    error,
    stats,
    refetch: fetchMembers,
  };
};

export const useMember = (memberId: string | undefined, session: any) => {
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMember = useCallback(async () => {
    if (!memberId || !session?.access_token) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data } = await axios.get(
        `${API_URL}/members/${memberId}`,
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );

      if (data.success) {
        setMember(data.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al cargar miembro');
    } finally {
      setLoading(false);
    }
  }, [memberId, session?.access_token]);

  useEffect(() => {
    fetchMember();
  }, [fetchMember]);

  return { member, loading, error, refetch: fetchMember };
};

export const useAssignMemberRoutine = (session: any) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const assignRoutine = async (memberId: string, routineId: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await axios.post(
        `${API_URL}/members/${memberId}/routines`,
        { routineId },
        {
          headers: { Authorization: `Bearer ${session.access_token}` },
        }
      );
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error al asignar rutina');
    } finally {
      setLoading(false);
    }
  };

  return { assignRoutine, loading, error, success, clearMessages: () => { setError(null); setSuccess(false); } };
};
