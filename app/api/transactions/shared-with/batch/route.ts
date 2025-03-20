import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email as string },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { transactionIds } = await request.json();

    if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
      return NextResponse.json(
        { error: "No transaction IDs provided" },
        { status: 400 }
      );
    }

    // Verify these are the user's transactions
    const transactions = await prisma.transaction.findMany({
      where: {
        id: { in: transactionIds },
        userId: user.id,
      },
      select: { id: true },
    });

    const foundIds = transactions.map((t) => t.id);

    // Check if any requested transactions don't belong to the user
    const invalidIds = transactionIds.filter((id) => !foundIds.includes(id));
    if (invalidIds.length > 0) {
      console.warn(
        `User ${
          user.id
        } attempted to access transactions they don't own: ${invalidIds.join(
          ", "
        )}`
      );
    }

    // Only proceed with valid IDs the user owns
    const sharedData = await prisma.sharedTransaction.findMany({
      where: {
        transactionId: { in: foundIds },
        sharedById: user.id,
      },
      include: {
        sharedWith: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Create a map of transactionId -> users
    const result = sharedData.reduce((acc, share) => {
      if (!acc[share.transactionId]) {
        acc[share.transactionId] = [];
      }
      acc[share.transactionId].push(share.sharedWith);
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({ sharedUsers: result });
  } catch (error) {
    console.error("Error fetching shared users in batch:", error);
    return NextResponse.json(
      { error: "Failed to fetch shared users" },
      { status: 500 }
    );
  }
}
