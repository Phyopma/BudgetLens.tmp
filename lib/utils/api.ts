import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

/**
 * Utility function to check if the user is authenticated
 */
export async function getAuthenticatedUser(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });

  return user;
}

/**
 * Validate invitation status
 */
export function isValidInvitationStatus(status: string): boolean {
  return ["pending", "accepted", "rejected"].includes(status);
}

/**
 * Check if two users have an accepted invitation between them
 */
export async function hasAcceptedInvitation(
  userId1: string,
  userId2: string
): Promise<boolean> {
  const invitation = await prisma.invitation.findFirst({
    where: {
      OR: [
        {
          senderId: userId1,
          recipientId: userId2,
          status: "accepted",
        },
        {
          senderId: userId2,
          recipientId: userId1,
          status: "accepted",
        },
      ],
    },
  });

  return !!invitation;
}

/**
 * Get all connected users for a given user
 */
export async function getConnectedUsers(userId: string) {
  // Get all accepted invitations
  const invitations = await prisma.invitation.findMany({
    where: {
      OR: [
        {
          senderId: userId,
          status: "accepted",
        },
        {
          recipientId: userId,
          status: "accepted",
        },
      ],
    },
    include: {
      sender: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      recipient: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Format the connected users
  return invitations
    .filter(
      (invitation) =>
        (invitation.senderId === userId && invitation.recipient) ||
        (invitation.recipientId === userId && invitation.sender)
    )
    .map((invitation) => {
      if (invitation.senderId === userId && invitation.recipient) {
        return {
          id: invitation.recipient.id,
          name: invitation.recipient.name || invitation.email,
          email: invitation.recipient.email || invitation.email,
        };
      } else if (invitation.recipientId === userId && invitation.sender) {
        return {
          id: invitation.sender.id,
          name: invitation.sender.name || "",
          email: invitation.sender.email || "",
        };
      }
      return null;
    })
    .filter(Boolean);
}
