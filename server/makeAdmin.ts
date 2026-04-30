import { db } from "./db/index.js";
import { users } from "./db/schema.js";
import { eq } from "drizzle-orm";

async function makeAdmin() {
  const email = process.argv[2];

  if (!email) {
    console.error("Please provide an email address. Usage: npx tsx server/makeAdmin.ts user@example.com");
    process.exit(1);
  }

  console.log(`Searching for user with email: ${email}...`);

  try {
    const [user] = await db.select().from(users).where(eq(users.email, email));

    if (!user) {
      console.error(`Error: No user found with email "${email}". Please sign up in the app first.`);
      process.exit(1);
    }

    await db.update(users)
      .set({ role: "admin" })
      .where(eq(users.id, user.id));

    console.log(`Success! User "${user.name}" (${email}) is now an Admin.`);
    process.exit(0);
  } catch (error) {
    console.error("Failed to update user role:", error.message);
    process.exit(1);
  }
}

makeAdmin();
