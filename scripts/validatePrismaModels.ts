import { PrismaClient } from "@prisma/client";

async function validatePrismaModels() {
  const prisma = new PrismaClient();

  try {
    console.log("Validating Prisma models...");

    // Try to get a transaction without referencing tags
    const transaction = await prisma.transaction.findFirst({
      select: {
        id: true,
        date: true,
        vendor: true,
        amount: true,
        category: true,
        transactionType: true,
        userId: true,
        // Add SharedTransaction validation
        sharedWith: {
          select: {
            id: true,
            sharedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
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

    console.log("Successfully fetched transaction:");
    console.log(transaction);

    // Also validate SharedTransaction model
    const sharedTransaction = await prisma.sharedTransaction.findFirst({
      include: {
        transaction: true,
        sharedBy: true,
        sharedWith: true,
      },
    });

    console.log("Successfully fetched shared transaction:");
    console.log(sharedTransaction);

    console.log("Prisma models are valid");
  } catch (error) {
    console.error("Validation failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the validation
validatePrismaModels().catch((e) => {
  console.error(e);
  process.exit(1);
});
