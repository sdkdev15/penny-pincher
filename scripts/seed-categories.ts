import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface DefaultCategory {
  name: string;
  isDefault: boolean;
  budget?: number;
}

// Default categories
const DEFAULT_CATEGORIES: DefaultCategory[] = [
  { name: "Salary", isDefault: true },
  { name: "Food & Groceries", isDefault: true, budget: 3000000 },
  { name: "Rent/Mortgage", isDefault: true },
  { name: "Utilities", isDefault: true, budget: 150000 },
  { name: "Transportation", isDefault: true, budget: 400000 },
  { name: "Entertainment", isDefault: true, budget: 500000 },
  { name: "Healthcare", isDefault: true },
  { name: "Education", isDefault: true },
  { name: "Shopping", isDefault: true, budget: 350000 },
  { name: "Gifts/Donations", isDefault: true },
  { name: "Freelance Income", isDefault: true },
  { name: "Investments", isDefault: true },
  { name: "Miscellaneous", isDefault: true },
];

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

  // Create categories from DEFAULT_CATEGORIES
  const created = await prisma.category.createMany({
    data: DEFAULT_CATEGORIES.map((cat) => ({
      name: cat.name,
      budget: cat.budget ?? null,
      isDefault: cat.isDefault,
      userId: adminUser.id,
    })),
  });

  console.log(`Created ${created.count} default categories for user "${DEFAULT_ADMIN_USERNAME}"`);

  // Calculate total budget
  const totalBudget = DEFAULT_CATEGORIES.reduce((sum, cat) => sum + (cat.budget ?? 0), 0);
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