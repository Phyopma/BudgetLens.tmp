import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { AccountBalance } from '@prisma/client';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user's session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id as string;
    const accountBalanceData = await request.json();

    const accountBalance = await prisma.accountBalance.create({
      data: {
        ...accountBalanceData,
        userId: userId,
      }
    });
    
    return NextResponse.json(accountBalance);
  } catch (error) {
    console.error('Error creating account balance:', error);
    return NextResponse.json({ error: 'Error creating account balance' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get the authenticated user's session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id as string;
    const searchParams = request.nextUrl.searchParams;
    const accountType = searchParams.get('accountType');

    const where: any = {
      userId: userId // Filter by the authenticated user's ID
    };
    
    if (accountType) where.accountType = accountType;

    const accountBalances = await prisma.accountBalance.findMany({
      where,
      orderBy: { timestamp: 'desc' },
    });

    return NextResponse.json(accountBalances);
  } catch (error) {
    console.error('Error fetching account balances:', error);
    return NextResponse.json({ error: 'Error fetching account balances' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    // Get the authenticated user's session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id as string;
    const { id, ...accountBalanceData } = await request.json();

    // Verify the account balance belongs to the user
    const existingBalance = await prisma.accountBalance.findUnique({
      where: { id },
    });

    if (!existingBalance || existingBalance.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized or balance not found' }, { status: 403 });
    }

    const updatedAccountBalance = await prisma.accountBalance.update({
      where: { id },
      data: accountBalanceData,
    });

    return NextResponse.json(updatedAccountBalance);
  } catch (error) {
    console.error('Error updating account balance:', error);
    return NextResponse.json({ error: 'Error updating account balance' }, { status: 500 });
  }
}