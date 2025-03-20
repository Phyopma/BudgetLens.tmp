import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SAMPLE_DATA = `date,vendor,amount,category,transactionType
2024-01-01,Job,2000.00,Job,Credit
2024-01-05,Grocery Store,150.00,Food & Dining,Debit
2024-01-10,Gas Station,60.00,Transportation,Debit
2024-01-12,Netflix,15.99,Entertainment,Debit
2024-01-15,Restaurant,45.00,Food & Dining,Debit
2024-01-18,Amazon,200.00,Shopping,Debit
2024-01-20,Utility Company,90.00,Bills & Utilities,Debit
2024-01-22,Refund,50.00,Refund,Credit
2024-01-25,Rent Payment,1200.00,Housing,Debit
2024-01-28,Pharmacy,25.00,Health & Medical,Debit
2024-02-02,Coffee Shop,5.00,Food & Dining,Debit
2024-02-05,Mobile Phone,70.00,Bills & Utilities,Debit
2024-02-08,Gym Membership,50.00,Health & Fitness,Debit
2024-02-10,Online Course,200.00,Education,Debit
2024-02-12,Car Insurance,125.00,Insurance,Debit
2024-02-15,Hardware Store,75.00,Home Improvement,Debit
2024-02-18,Freelance Work,500.00,Job,Credit
2024-02-20,Supermarket,100.00,Food & Dining,Debit
2024-02-22,Taxi,30.00,Transportation,Debit
2024-02-25,Concert,50.00,Entertainment,Debit
2024-02-28,Clothing Store,150.00,Shopping,Debit
2024-02-28,Side Hustle,150.00,Job,Credit
2024-03-01,Electricity Bill,100.00,Bills & Utilities,Debit
2024-03-05,Water Bill,30.00,Bills & Utilities,Debit
2024-03-05,Refund,25.00,Refund,Credit
2024-03-08,Doctor Visit,75.00,Health & Medical,Debit
2024-03-10,Bookstore,40.00,Education,Debit
2024-03-10,Side Hustle,200.00,Job,Credit
2024-03-12,Home Decor,60.00,Home Improvement,Debit
2024-03-15,Part-time Job,300.00,Job,Credit`;

async function seedDatabase() {
  try {
    // Clear existing data
    await prisma.sharedTransaction.deleteMany();
    await prisma.invitation.deleteMany();
    await prisma.accountBalance.deleteMany();
    await prisma.bankAccount.deleteMany();
    await prisma.transaction.deleteMany();
    await prisma.session.deleteMany();
    await prisma.account.deleteMany();
    await prisma.user.deleteMany();

    // Create test users
    const hashedPassword = await bcrypt.hash("password123", 10);

    const mainUser = await prisma.user.create({
      data: {
        name: "Test User",
        email: "test@example.com",
        password: hashedPassword,
      },
    });

    const secondUser = await prisma.user.create({
      data: {
        name: "Connected User",
        email: "connected@example.com",
        password: hashedPassword,
      },
    });

    const thirdUser = await prisma.user.create({
      data: {
        name: "Another User",
        email: "another@example.com",
        password: hashedPassword,
      },
    });

    // Create accepted invitation between users
    await prisma.invitation.create({
      data: {
        email: secondUser.email,
        status: "accepted",
        senderId: mainUser.id,
        recipientId: secondUser.id,
      },
    });

    await prisma.invitation.create({
      data: {
        email: thirdUser.email,
        status: "accepted",
        senderId: mainUser.id,
        recipientId: thirdUser.id,
      },
    });

    // Create bank accounts for main user
    const checkingAccount = await prisma.bankAccount.create({
      data: {
        name: "Primary Checking",
        accountType: "Checking",
        bankName: "Example Bank",
        accountNumber: "123456789",
        userId: mainUser.id,
      },
    });

    const savingsAccount = await prisma.bankAccount.create({
      data: {
        name: "Savings Account",
        accountType: "Savings",
        bankName: "Example Bank",
        accountNumber: "987654321",
        userId: mainUser.id,
      },
    });

    // Create account balances
    await prisma.accountBalance.create({
      data: {
        accountId: checkingAccount.id,
        balance: 2500.0,
        userId: mainUser.id,
      },
    });

    await prisma.accountBalance.create({
      data: {
        accountId: savingsAccount.id,
        balance: 5000.0,
        userId: mainUser.id,
      },
    });

    // Parse and insert sample transactions for main user
    const lines = SAMPLE_DATA.trim().split("\n");
    const transactions = lines.slice(1).map((line) => {
      const [date, vendor, amount, category, transactionType] = line
        .split(",")
        .map((item) => item.trim());
      return {
        date,
        vendor,
        amount: parseFloat(amount),
        category,
        transactionType,
        userId: mainUser.id, // Make sure userId is always included
      };
    });

    // Insert transactions in batches to avoid too many records
    const transactionChunks = [];
    for (let i = 0; i < transactions.length; i += 10) {
      transactionChunks.push(transactions.slice(i, i + 10));
    }

    for (const chunk of transactionChunks) {
      // Ensure each transaction has userId
      const chunkWithUserIds = chunk.map((tx) => ({
        ...tx,
        userId: mainUser.id, // Explicitly set userId for each transaction
      }));

      const result = await prisma.transaction.createMany({
        data: chunkWithUserIds,
      });
      console.log(`Created ${result.count} transactions`);
    }

    // Create some shared transactions
    const allTransactions = await prisma.transaction.findMany({
      where: { userId: mainUser.id },
      take: 5, // Share the first 5 transactions
    });

    // Share with second user
    for (const transaction of allTransactions.slice(0, 3)) {
      await prisma.sharedTransaction.create({
        data: {
          transactionId: transaction.id,
          sharedById: mainUser.id,
          sharedWithId: secondUser.id,
        },
      });
    }

    // Share with third user
    for (const transaction of allTransactions.slice(2, 5)) {
      await prisma.sharedTransaction.create({
        data: {
          transactionId: transaction.id,
          sharedById: mainUser.id,
          sharedWithId: thirdUser.id,
        },
      });
    }

    console.log("Database seeded successfully");
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase().catch((e) => {
  console.error(e);
  process.exit(1);
});
