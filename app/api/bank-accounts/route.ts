import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { BankAccount } from '@prisma/client';
import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';

// Create a new bank account
export async function POST(request: NextRequest) {
  try {
    // Get the authenticated user's session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id as string;
    const bankAccountData = await request.json();

    const bankAccount = await prisma.bankAccount.create({
      data: {
        ...bankAccountData,
        userId: userId,
      }
    });
    
    return NextResponse.json(bankAccount);
  } catch (error) {
    console.error('Error creating bank account:', error);
    return NextResponse.json({ error: 'Error creating bank account' }, { status: 500 });
  }
}

// Get all bank accounts for the authenticated user
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

    const bankAccounts = await prisma.bankAccount.findMany({
      where,
      include: {
        balances: {
          orderBy: { timestamp: 'desc' },
          take: 1
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bankAccounts);
  } catch (error) {
    console.error('Error fetching bank accounts:', error);
    return NextResponse.json({ error: 'Error fetching bank accounts' }, { status: 500 });
  }
}

// Update a bank account
export async function PUT(request: NextRequest) {
  try {
    // Get the authenticated user's session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id as string;
    const { id, ...bankAccountData } = await request.json();

    // Verify the bank account belongs to the user
    const existingAccount = await prisma.bankAccount.findUnique({
      where: { id },
    });

    if (!existingAccount || existingAccount.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized or account not found' }, { status: 403 });
    }

    const updatedBankAccount = await prisma.bankAccount.update({
      where: { id },
      data: bankAccountData,
    });

    return NextResponse.json(updatedBankAccount);
  } catch (error) {
    console.error('Error updating bank account:', error);
    return NextResponse.json({ error: 'Error updating bank account' }, { status: 500 });
  }
}

// Delete a bank account
export async function DELETE(request: NextRequest) {
  try {
    // Get the authenticated user's session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id as string;
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Account ID is required' }, { status: 400 });
    }

    // Verify the bank account belongs to the user
    const existingAccount = await prisma.bankAccount.findUnique({
      where: { id },
    });

    if (!existingAccount || existingAccount.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized or account not found' }, { status: 403 });
    }

    // Delete the bank account (this will also delete associated balances due to cascade)
    await prisma.bankAccount.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting bank account:', error);
    return NextResponse.json({ error: 'Error deleting bank account' }, { status: 500 });
  }
}