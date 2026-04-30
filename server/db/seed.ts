import { db } from "./index.js";
import { tools, users } from "./schema.js";

async function seed() {
  console.log("Seeding database...");

  // Create a demo user
  const [user] = await db.insert(users).values({
    name: "Demo User",
    email: "demo@toolhopp.com",
    role: "user",
  }).onDuplicateKeyUpdate({ set: { name: "Demo User" } }).returning();

  const userId = user?.id || 1;

  // Create some tools
  await db.insert(tools).values([
    {
      ownerId: userId,
      title: "DeWalt Cordless Drill",
      category: "Power Tools",
      description: "High-performance drill with 2 batteries.",
      condition: "excellent",
      pricePerHour: "1.50",
      location: "San Francisco, CA",
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?w=800&q=80"
    },
    {
      ownerId: userId,
      title: "Milwaukee Sawzall",
      category: "Power Tools",
      description: "Heavy-duty reciprocating saw.",
      condition: "good",
      pricePerHour: "2.00",
      location: "Oakland, CA",
      isAvailable: true,
      imageUrl: "https://images.unsplash.com/photo-1572981779307-38b8cabb2407?w=800&q=80"
    }
  ]);

  console.log("Seeding completed!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
