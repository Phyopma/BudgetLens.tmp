import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../auth/[...nextauth]/route";

// Handle invitation response (accept/reject)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authenticated user's session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;
    const invitationId = params.id;
    const { status } = await request.json();

    if (!["accepted", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    // Find the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
      include: { sender: true },
    });

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Verify that the current user is the recipient of the invitation
    if (invitation.recipientId && invitation.recipientId !== userId) {
      return NextResponse.json(
        { error: "You are not authorized to respond to this invitation" },
        { status: 403 }
      );
    }

    // If the invitation is for the user's email but not linked to their account yet
    if (!invitation.recipientId && invitation.email === session.user.email) {
      // Update the invitation to link it to the user's account
      await prisma.invitation.update({
        where: { id: invitationId },
        data: { recipientId: userId },
      });
    }

    // Update the invitation status
    const updatedInvitation = await prisma.invitation.update({
      where: { id: invitationId },
      data: { status },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // If the invitation is accepted, share the sender's transactions with the recipient
    if (status === "accepted") {
      // Get all transactions from the sender
      const senderTransactions = await prisma.transaction.findMany({
        where: { userId: invitation.senderId },
      });

      // Create SharedTransaction records for each transaction
      for (const transaction of senderTransactions) {
        await prisma.sharedTransaction.create({
          data: {
            transactionId: transaction.id,
            sharedById: invitation.senderId,
            sharedWithId: userId,
          },
        });
      }
    }

    return NextResponse.json(updatedInvitation);
  } catch (error) {
    console.error("Error responding to invitation:", error);
    return NextResponse.json(
      { error: "Error responding to invitation" },
      { status: 500 }
    );
  }
}

// Get a specific invitation
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the authenticated user's session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;
    const invitationId = params.id;

    // Find the invitation
    const invitation = await prisma.invitation.findUnique({
      where: { id: invitationId },
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

    if (!invitation) {
      return NextResponse.json(
        { error: "Invitation not found" },
        { status: 404 }
      );
    }

    // Verify that the current user is either the sender or the recipient
    if (
      invitation.senderId !== userId &&
      invitation.recipientId !== userId &&
      invitation.email !== session.user.email
    ) {
      return NextResponse.json(
        { error: "You are not authorized to view this invitation" },
        { status: 403 }
      );
    }

    return NextResponse.json(invitation);
  } catch (error) {
    console.error("Error fetching invitation:", error);
    return NextResponse.json(
      { error: "Error fetching invitation" },
      { status: 500 }
    );
  }
}
