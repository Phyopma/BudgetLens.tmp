import { useState, useEffect } from "react";
import { User } from "@/lib/types";

export const useConnections = () => {
  const [connections, setConnections] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConnections = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/connections");

      if (!response.ok) {
        throw new Error("Failed to fetch connections");
      }

      const data = await response.json();
      setConnections(data.connections || []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
      console.error("Error fetching connections:", err);
    } finally {
      setLoading(false);
    }
  };

  const sendInvitation = async (email: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/connections/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send invitation");
      }

      // Refresh connections after sending invitation
      await fetchConnections();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send invitation"
      );
      console.error("Error sending invitation:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const acceptInvitation = async (invitationId: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/connections/accept/${invitationId}`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to accept invitation");
      }

      // Refresh connections after accepting invitation
      await fetchConnections();
      return true;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to accept invitation"
      );
      console.error("Error accepting invitation:", err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConnections();
  }, []);

  return {
    connections,
    loading,
    error,
    fetchConnections,
    sendInvitation,
    acceptInvitation,
  };
};
