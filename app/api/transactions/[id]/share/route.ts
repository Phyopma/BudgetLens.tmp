import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const id = params.id;
    const { userIds } = await request.json();

    if (!id || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        { error: "Invalid request data" },
        { status: 400 }
      );
    }

    // Get the current user
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        sharedWith: {
          include: {
            sharedWith: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Verify that the current user owns the transaction
    if (transaction.userId !== currentUser.id) {
      return NextResponse.json(
        { error: "Not authorized to share this transaction" },
        { status: 403 }
      );
    }

    // Prepare batch transaction data
    const sharedTransactionsData = [];
    const sharedUsers = [];

    // Check each user and prepare data for batch creation
    for (const userId of userIds) {
      // Skip if userId is empty or undefined
      if (!userId) {
        console.log("Skipping empty userId");
        continue;
      }

      // Check if user exists
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true },
      });

      if (!user) {
        console.log(`User with ID ${userId} not found`);
        continue;
      }

      // Check if there's an accepted invitation between the users
      const hasAcceptedInvitation = await prisma.invitation.findFirst({
        where: {
          OR: [
            {
              senderId: currentUser.id,
              recipientId: userId,
              status: "accepted", // Using lowercase to match the database schema
            },
            {
              senderId: userId,
              recipientId: currentUser.id,
              status: "accepted", // Using lowercase to match the database schema
            },
          ],
        },
      });

      // Detailed logging to help troubleshoot invitation issues
      console.log(
        `Checking invitation between ${currentUser.id} and ${userId}:`,
        hasAcceptedInvitation ? "Found" : "Not found"
      );

      if (!hasAcceptedInvitation) {
        console.log(
          `No accepted invitation found between ${currentUser.id} and ${userId}`
        );
        continue;
      }

      console.log(
        `Found accepted invitation between ${currentUser.id} and ${userId}`
      );

      // Check if already shared with this user
      const existingShare = await prisma.sharedTransaction.findFirst({
        where: {
          transactionId: transaction.id,
          sharedWithId: userId, // This should be the selected user ID
        },
      });

      if (existingShare) {
        console.log(`Transaction already shared with user ${userId}`);
        sharedUsers.push(user);
        continue;
      }

      // Add data for batch creation
      sharedTransactionsData.push({
        transactionId: transaction.id,
        sharedWithId: userId, // This should be the selected user ID
        sharedById: currentUser.id,
      });

      sharedUsers.push(user);
    }

    // Create all shared transactions in one batch if there are any to create
    if (sharedTransactionsData.length > 0) {
      await prisma.sharedTransaction.createMany({
        data: sharedTransactionsData,
        skipDuplicates: true,
      });

      console.log(
        `Created ${sharedTransactionsData.length} shared transaction records`
      );
    }

    // Return updated transaction with share information
    return NextResponse.json({
      id: transaction.id,
      isShared: true,
      sharedWith: sharedUsers,
      sharedBy: {
        id: currentUser.id,
        name: currentUser.name,
      },
    });
  } catch (error) {
    console.error("Error sharing transaction:", error);
    return NextResponse.json(
      { error: "Failed to share transaction" },
      { status: 500 }
    );
  }
}
