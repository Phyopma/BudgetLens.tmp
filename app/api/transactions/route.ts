import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Transaction } from "@prisma/client";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user's session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;
    const transactions = await request.json();

    // If it's a single transaction
    if (!Array.isArray(transactions)) {
      // Remove tags property if it exists
      const { tags, ...transactionData } = transactions;

      // Validate required fields
      if (
        !transactionData.date ||
        !transactionData.vendor ||
        !transactionData.category ||
        !transactionData.transactionType
      ) {
        return NextResponse.json(
          {
            error:
              "Missing required fields: date, vendor, category, and transactionType are required",
          },
          { status: 400 }
        );
      }

      const transaction = await prisma.transaction.create({
        data: {
          ...transactionData,
          amount: transactionData.amount ?? 0,
          userId: userId,
        },
      });
      return NextResponse.json(transaction);
    }

    // It's an array of transactions (CSV import)
    // Ensure each transaction has all required fields
    const processedTransactions = [];

    for (const transaction of transactions) {
      const { tags, ...transactionData } = transaction;

      // Validate that all required fields are present
      if (
        !transactionData.date ||
        !transactionData.vendor ||
        !transactionData.category ||
        !transactionData.transactionType
      ) {
        continue; // Skip invalid transactions
      }

      processedTransactions.push({
        ...transactionData,
        amount: transactionData.amount ?? 0,
        userId: userId,
      });
    }

    // If no valid transactions were found, return an error
    if (processedTransactions.length === 0) {
      return NextResponse.json(
        {
          error:
            "No valid transactions found. Required fields: date, vendor, category, and transactionType",
        },
        { status: 400 }
      );
    }

    // Create the valid transactions
    const createdTransactions = await prisma.transaction.createMany({
      data: processedTransactions,
      skipDuplicates: true,
    });

    return NextResponse.json(createdTransactions);
  } catch (error) {
    console.error("Error creating transaction(s):", error);
    return NextResponse.json(
      { error: "Error creating transaction(s)" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
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

    const userId = user.id;
    const searchParams = request.nextUrl.searchParams;

    const category = searchParams.get("category");
    const vendor = searchParams.get("vendor");
    const transactionType = searchParams.get("transactionType");
    const amount = searchParams.get("amount");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const includeShared = searchParams.get("includeShared") === "true";

    // Remove any reference to tags in filters from URL params
    const tagsParam = searchParams.get("tags");
    // We're ignoring tags param now that we've removed tags from the model

    // Build the where clause - ensure no tags filter
    const where: any = { userId };

    if (category) where.category = category;
    if (vendor) where.vendor = vendor;
    if (transactionType) where.transactionType = transactionType;
    if (amount) where.amount = parseFloat(amount);
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    // Make sure to not include any tags filter here

    // Get user's own transactions - without including tags
    const ownTransactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // If includeShared is true, also get transactions shared with the user
    let sharedTransactions = [];
    if (includeShared) {
      // Build the where clause for shared transactions - ensure no tags filter
      const sharedWhere: any = {};

      if (category) sharedWhere.category = category;
      if (vendor) sharedWhere.vendor = vendor;
      if (transactionType) sharedWhere.transactionType = transactionType;
      if (amount) sharedWhere.amount = parseFloat(amount);
      if (startDate || endDate) {
        sharedWhere.date = {};
        if (startDate) sharedWhere.date.gte = startDate;
        if (endDate) sharedWhere.date.lte = endDate;
      }

      // Get transactions shared with the user through SharedTransaction
      const sharedTransactionIds = await prisma.sharedTransaction.findMany({
        where: {
          sharedWithId: userId,
        },
        select: {
          transactionId: true,
        },
      });

      // Get the actual transactions if there are any shared ones
      if (sharedTransactionIds.length > 0) {
        sharedTransactions = await prisma.transaction.findMany({
          where: {
            ...sharedWhere,
            id: {
              in: sharedTransactionIds.map((st) => st.transactionId),
            },
          },
          orderBy: { date: "desc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
            // Include who shared the transaction
            sharedWith: {
              where: {
                sharedWithId: userId,
              },
              include: {
                sharedBy: {
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

        // Add a virtual field to indicate this is a shared transaction and who shared it
        sharedTransactions = sharedTransactions.map((transaction) => {
          const sharedBy = transaction.sharedWith[0]?.sharedBy;
          return {
            ...transaction,
            isShared: true,
            sharedBy: sharedBy
              ? {
                  id: sharedBy.id,
                  name: sharedBy.name || sharedBy.email,
                }
              : null,
          };
        });
      }
    }

    // Combine and return all transactions
    const transactions = [...ownTransactions, ...sharedTransactions];

    return NextResponse.json(transactions);
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json(
      { error: "Error fetching transactions" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transaction = await request.json();
    // Remove tags property if it exists
    const { tags, ...transactionData } = transaction;

    const userId = session.user.id as string;

    // Verify the user owns this transaction
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id: transaction.id },
      select: { userId: true },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    if (existingTransaction.userId !== userId) {
      return NextResponse.json(
        { error: "You don't have permission to update this transaction" },
        { status: 403 }
      );
    }

    const updatedTransaction = await prisma.transaction.update({
      where: { id: transaction.id },
      data: transactionData,
    });

    return NextResponse.json(updatedTransaction);
  } catch (error) {
    console.error("Error updating transaction:", error);
    return NextResponse.json(
      { error: "Error updating transaction" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get the authenticated user's session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    // First check if the transaction belongs to the authenticated user
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existingTransaction) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 }
      );
    }

    if (existingTransaction.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized: You can only delete your own transactions" },
        { status: 403 }
      );
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting transaction:", error);
    return NextResponse.json(
      { error: "Error deleting transaction" },
      { status: 500 }
    );
  }
}
