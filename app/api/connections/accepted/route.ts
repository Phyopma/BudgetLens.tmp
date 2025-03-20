import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("Fetching accepted connections for user:", currentUser.id);

    // Array to collect all connected users
    let connectedUsers = [];

    // Get all accepted invitations where the current user is either sender or recipient
    const invitations = await prisma.invitation.findMany({
      where: {
        OR: [
          {
            senderId: currentUser.id,
            status: "accepted",
          },
          {
            recipientId: currentUser.id,
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

    console.log(`Found ${invitations.length} accepted invitations`);

    // Process invitation-based connections
    for (const invitation of invitations) {
      // If the current user is the sender, add the recipient as a connected user
      if (invitation.senderId === currentUser.id && invitation.recipient) {
        connectedUsers.push({
          id: invitation.recipient.id,
          name: invitation.recipient.name || "User",
          email: invitation.recipient.email || invitation.email,
        });
      }

      // If the current user is the recipient, add the sender as a connected user
      if (invitation.recipientId === currentUser.id && invitation.sender) {
        connectedUsers.push({
          id: invitation.sender.id,
          name: invitation.sender.name || "User",
          email: invitation.sender.email,
        });
      }
    }

    console.log(`Returning ${connectedUsers.length} total connected users`);

    return NextResponse.json({ connections: connectedUsers });
  } catch (error) {
    console.error("Error fetching accepted connections:", error);
    return NextResponse.json(
      { error: "Failed to fetch connected users" },
      { status: 500 }
    );
  }
}
