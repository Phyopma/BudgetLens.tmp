"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useInvitations } from "@/hooks/useInvitations";
import { Invitation } from "@/lib/types";
import { Mail, Check, X, RefreshCw, UserPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function InvitationManager() {
  const { data: session } = useSession();
  const userId = session?.user?.id as string;
  const { toast } = useToast();
  const {
    invitations,
    loading,
    error,
    fetchInvitations,
    sendInvitation,
    respondToInvitation,
  } = useInvitations();

  const [inviteEmail, setInviteEmail] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("received");
  const [processingInvitation, setProcessingInvitation] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      const timeoutId = setTimeout(() => {
        fetchInvitations(activeTab as "all" | "sent" | "received");
      }, 300);
      return () => clearTimeout(timeoutId);
    }
  }, [activeTab, session?.user?.email, fetchInvitations]);

  const handleSendInvitation = async () => {
    if (!inviteEmail || !inviteEmail.includes("@")) {
      toast({
        title: "Invalid email",
        description: "Please enter a valid email address",
        variant: "destructive",
      });
      return;
    }

    try {
      await sendInvitation(inviteEmail);
      toast({
        title: "Invitation sent",
        description: `Invitation has been sent to ${inviteEmail}`,
      });
      setInviteEmail("");
      setIsDialogOpen(false);
      // Refresh the sent invitations list
      if (activeTab === "sent") {
        fetchInvitations("sent");
      }
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : "Failed to send invitation",
        variant: "destructive",
      });
    }
  };

  const handleRespondToInvitation = async (
    invitationId: string,
    status: "accepted" | "rejected"
  ) => {
    if (processingInvitation) return;

    try {
      setProcessingInvitation(true);

      await respondToInvitation(invitationId, status);

      toast({
        title:
          status === "accepted" ? "Invitation accepted" : "Invitation rejected",
        description:
          status === "accepted"
            ? "You now have access to shared transactions"
            : "Invitation has been rejected",
      });

      // Refresh the invitations list
      fetchInvitations(activeTab as "all" | "sent" | "received");

      // If an invitation was accepted, refresh the connections data
      if (status === "accepted") {
        // Clear the connections cache by making a request to the API
        try {
          await fetch("/api/connections/accepted", {
            method: "GET",
            cache: "no-store",
            headers: {
              "Cache-Control": "no-cache",
            },
          });

          // Refresh the page after a short delay
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } catch (error) {
          console.error("Error refreshing connections:", error);
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description:
          err instanceof Error ? err.message : `Failed to ${status} invitation`,
        variant: "destructive",
      });
    } finally {
      setProcessingInvitation(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "accepted":
        return <Badge variant="default">Accepted</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardDescription>
              Invite others to share transactions or view your invitations
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                Invite User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite User</DialogTitle>
                <DialogDescription>
                  Enter the email address of the person you want to invite to
                  share transactions.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="col-span-3"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleSendInvitation}>Send Invitation</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs
          defaultValue="received"
          value={activeTab}
          onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="received">Received</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
          </TabsList>

          <div className="mt-4 flex justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                fetchInvitations(activeTab as "all" | "sent" | "received")
              }
              disabled={loading}>
              <RefreshCw
                className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>
          </div>

          <TabsContent value="received">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center p-6 text-destructive">{error}</div>
            ) : invitations.filter(
                (invitation) =>
                  invitation.email === session?.user?.email ||
                  (invitation.recipient &&
                    invitation.recipient.email === session?.user?.email)
              ).length === 0 ? (
              <div className="text-center p-6 text-muted-foreground">
                No invitations received
              </div>
            ) : (
              invitations
                .filter(
                  (invitation) =>
                    invitation.email === session?.user?.email ||
                    (invitation.recipient &&
                      invitation.recipient.email === session?.user?.email)
                )
                .map((invitation) => (
                  <div
                    key={invitation.id}
                    className="mb-4 flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center space-x-4">
                      <Mail className="h-6 w-6" />
                      <div>
                        <p className="font-medium">
                          {invitation.sender
                            ? invitation.sender.email
                            : "Unknown sender"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {getStatusBadge(invitation.status)}
                        </p>
                      </div>
                    </div>
                    {invitation.status === "pending" && (
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleRespondToInvitation(invitation.id, "accepted")
                          }>
                          <Check className="mr-2 h-4 w-4" />
                          Accept
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleRespondToInvitation(invitation.id, "rejected")
                          }>
                          <X className="mr-2 h-4 w-4" />
                          Reject
                        </Button>
                      </div>
                    )}
                  </div>
                ))
            )}
          </TabsContent>

          <TabsContent value="sent">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center p-6 text-destructive">{error}</div>
            ) : invitations.filter(
                (invitation) => invitation.senderId === userId
              ).length === 0 ? (
              <div className="text-center p-6 text-muted-foreground">
                No invitations sent
              </div>
            ) : (
              invitations
                .filter((invitation) => invitation.senderId === userId)
                .map((invitation) => (
                  <div
                    key={invitation.id}
                    className="mb-4 flex items-center justify-between rounded-lg border p-4">
                    <div className="flex items-center space-x-4">
                      <Mail className="h-6 w-6" />
                      <div>
                        <p className="font-medium">{invitation.email}</p>
                        <p className="text-sm text-gray-500">
                          {getStatusBadge(invitation.status)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
