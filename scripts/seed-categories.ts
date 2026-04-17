import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const DEFAULT_ADMIN_USERNAME = "admin";

  console.log("Seeding default categories...");

  // Get admin user
  const adminUser = await prisma.user.findUnique({
    where: { username: DEFAULT_ADMIN_USERNAME },
  });

  if (!adminUser) {
    console.error("Admin user not found. Please run seed-admin.ts first.");
    return;
  }

  // Check if categories already exist for admin
  const existingCategories = await prisma.category.findMany({
    where: { userId: adminUser.id, isDefault: true },
  });

  if (existingCategories.length > 0) {
    console.log("Default categories already exist for admin user.");
    return;
  }

  // Default categories for Jakarta (budget in IDR)
  const defaultCategories = [
    { name: "Transportation", budget: 1000000, isDefault: true },
    { name: "Grocery", budget: 2000000, isDefault: true },
    { name: "Food & Entertainment", budget: 1500000, isDefault: true },
    { name: "Utilities", budget: 500000, isDefault: true },
    { name: "Internet & Phone", budget: 300000, isDefault: true },
    { name: "Healthcare", budget: 300000, isDefault: true },
    { name: "Shopping", budget: 500000, isDefault: true },
    { name: "Education", budget: 200000, isDefault: true },
    { name: "Savings", budget: 3700000, isDefault: true },
  ];

  // Create categories
  const created = await prisma.category.createMany({
    data: defaultCategories.map((cat) => ({
      ...cat,
      userId: adminUser.id,
    })),
  });

  console.log(`Created ${created.count} default categories for user "${DEFAULT_ADMIN_USERNAME}"`);

  // Calculate total budget
  const totalBudget = defaultCategories.reduce((sum, cat) => sum + cat.budget, 0);
  console.log(`Total monthly budget: IDR ${totalBudget.toLocaleString("id-ID")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });