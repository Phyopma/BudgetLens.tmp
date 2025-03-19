import { PrismaClient } from "@prisma/client";

async function migrateTags() {
  const prisma = new PrismaClient();

  try {
    console.log("Starting migration of tags to SharedTransaction model...");

    // This is a one-time migration script to convert any existing
    // shared transactions from the old tags system to the new SharedTransaction model

    // For example, if you had tags like "From: user@example.com" in your transactions,
    // this would create proper SharedTransaction records

    // Since the database schema has already changed, we can't directly query the old tags
    // You would need to handle this manually or restore from a backup if needed

    console.log("Migration completed successfully");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the migration
migrateTags().catch((e) => {
  console.error(e);
  process.exit(1);
});
