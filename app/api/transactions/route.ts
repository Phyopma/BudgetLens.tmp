import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import type { Transaction } from '@prisma/client';
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
    const transactions = await request.json();

    // If it's a single transaction
    if (!Array.isArray(transactions)) {
      const transaction = await prisma.transaction.create({
        data: {
          ...transactions,
           amount: transactions.amount ?? 0, //
          userId: userId,
        },
      });
      return NextResponse.json(transaction);
    }    
    
    
    // Ensure each transaction has an amount and userId
    const processedTransactions = transactions.map((transaction: any) => ({
      ...transaction,
      amount: transaction.amount ?? 0, // Default to 0 if amount is missing
      userId: userId, // Add the authenticated user's ID
    }));
  
    // If it's an array of transactions (CSV import)
    const createdTransactions = await prisma.transaction.createMany({
      data: processedTransactions,
      skipDuplicates: true,
    });
    
    return NextResponse.json(createdTransactions);
  } catch (error) {
    console.error('Error creating transaction(s):', error);
    return NextResponse.json({ error: 'Error creating transaction(s)' }, { status: 500 });
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
    const category = searchParams.get('category');
    const vendor = searchParams.get('vendor');
    const transactionType = searchParams.get('transactionType');
    const amount = searchParams.get('amount');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    const where: any = {
      userId: userId // Filter by the authenticated user's ID
    };
    
    if (category) where.category = category;
    if (vendor) where.vendor = vendor;
    if (transactionType) where.transactionType = transactionType;
    if (amount) where.amount = parseFloat(amount);
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return NextResponse.json({ error: 'Error fetching transactions' }, { status: 500 });
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
    const { id, ...data } = await request.json();
    
    // First check if the transaction belongs to the authenticated user
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
    });
    
    if (!existingTransaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    
    if (existingTransaction.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized: You can only update your own transactions' }, { status: 403 });
    }
    
    const transaction = await prisma.transaction.update({
      where: { id },
      data,
    });
    
    return NextResponse.json(transaction);
  } catch (error) {
    console.error('Error updating transaction:', error);
    return NextResponse.json({ error: 'Error updating transaction' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Get the authenticated user's session
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id as string;
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'Transaction ID is required' }, { status: 400 });
    }
    
    // First check if the transaction belongs to the authenticated user
    const existingTransaction = await prisma.transaction.findUnique({
      where: { id },
    });
    
    if (!existingTransaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }
    
    if (existingTransaction.userId !== userId) {
      return NextResponse.json({ error: 'Unauthorized: You can only delete your own transactions' }, { status: 403 });
    }

    await prisma.transaction.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    return NextResponse.json({ error: 'Error deleting transaction' }, { status: 500 });
  }
}
