import { useState, useCallback, useEffect } from 'react';
import { Invitation } from '@/lib/types';

export const useInvitations = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = useCallback(async (type: 'all' | 'sent' | 'received' = 'all') => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invitations?type=${type}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch invitations');
      }
      
      const data = await response.json();
      setInvitations(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchInvitations('all');
  }, [fetchInvitations]);

  const sendInvitation = async (email: string) => {
    try {
      setLoading(true);
      const response = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send invitation');
      }

      const newInvitation = await response.json();
      setInvitations((prev) => [newInvitation, ...prev]);
      setError(null);
      return newInvitation;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send invitation');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const respondToInvitation = async (invitationId: string, status: 'accepted' | 'rejected') => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to ${status} invitation`);
      }

      const updatedInvitation = await response.json();
      
      // Update the invitation in the state
      setInvitations((prev) =>
        prev.map((inv) => (inv.id === invitationId ? updatedInvitation : inv))
      );
      
      setError(null);
      return updatedInvitation;
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${status} invitation`);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    invitations,
    loading,
    error,
    fetchInvitations,
    sendInvitation,
    respondToInvitation,
  };
};