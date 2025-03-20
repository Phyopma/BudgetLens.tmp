import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../../auth/[...nextauth]/route";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const transactionId = params.id;

    // First check if the transaction belongs to the current user
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    // Only allow the transaction owner to see who it's shared with
    if (transaction.userId !== user.id) {
      return NextResponse.json(
        { error: "You don't have permission to view this information" },
        { status: 403 }
      );
    }

    // Fetch users this transaction is shared with
    const sharedWith = await prisma.sharedTransaction.findMany({
      where: {
        transactionId: transactionId,
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

    // Extract just the user info
    const users = sharedWith.map((share) => share.sharedWith);

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Error fetching shared users:", error);
    return NextResponse.json(
      { error: "Failed to fetch shared users" },
      { status: 500 }
    );
  }
}
