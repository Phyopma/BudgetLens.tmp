import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { AccountBalance } from "@prisma/client";
import { NextRequest } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accountId, balance } = await request.json();

    if (!accountId || balance === undefined) {
      return NextResponse.json(
        { error: "Account ID and balance are required" },
        { status: 400 }
      );
    }

    const userId = session.user.id as string;

    // Verify the account belongs to the user
    const account = await prisma.bankAccount.findUnique({
      where: { id: accountId },
      select: { userId: true },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    if (account.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized to modify this account" },
        { status: 403 }
      );
    }

    // Create the account balance record
    const accountBalance = await prisma.accountBalance.create({
      data: {
        accountId,
        balance: parseFloat(balance.toString()),
        userId,
      },
    });

    // NOTE: Don't update latestBalance directly on bankAccount since it's not a field in the schema
    // Instead, the frontend should calculate this from the account balance records

    return NextResponse.json(accountBalance);
  } catch (error) {
    console.error("Error creating account balance:", error);
    return NextResponse.json(
      { error: "Failed to create account balance" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user's session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get("accountId");

    const where: any = {
      userId: userId, // Filter by the authenticated user's ID
    };

    if (accountId) where.accountId = accountId;

    const accountBalances = await prisma.accountBalance.findMany({
      where,
      orderBy: { timestamp: "desc" },
    });

    return NextResponse.json(accountBalances);
  } catch (error) {
    console.error("Error fetching account balances:", error);
    return NextResponse.json(
      { error: "Error fetching account balances" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get the authenticated user's session
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id as string;
    const { id, ...accountBalanceData } = await request.json();

    // Verify the account balance belongs to the user
    const existingBalance = await prisma.accountBalance.findUnique({
      where: { id },
    });

    if (!existingBalance || existingBalance.userId !== userId) {
      return NextResponse.json(
        { error: "Unauthorized or balance not found" },
        { status: 403 }
      );
    }

    const updatedAccountBalance = await prisma.accountBalance.update({
      where: { id },
      data: accountBalanceData,
    });

    // If the account ID didn't change, update the latest balance on the bank account
    if (existingBalance.accountId === accountBalanceData.accountId) {
      // Get the latest balance for this account
      const latestBalance = await prisma.accountBalance.findFirst({
        where: { accountId: accountBalanceData.accountId },
        orderBy: { timestamp: "desc" },
      });

      // Update the bank account with the latest balance
      if (latestBalance) {
        await prisma.bankAccount.update({
          where: { id: accountBalanceData.accountId },
          data: { latestBalance: latestBalance.balance },
        });
      }
    }

    return NextResponse.json(updatedAccountBalance);
  } catch (error) {
    console.error("Error updating account balance:", error);
    return NextResponse.json(
      { error: "Error updating account balance" },
      { status: 500 }
    );
  }
}
