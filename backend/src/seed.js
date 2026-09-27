import "dotenv/config";
import bcrypt from "bcryptjs";
import User from "./models/user.model.js";
import { connectDB, disconnectDB } from "./config/db.js";
import logger from "./utils/logger.js";

export const TEST_USERS = [
  {
    username: "alice_collab",
    email: "alice@boardcollab.dev",
    password: "Password123!"
  },
  {
    username: "bob_designer",
    email: "bob@boardcollab.dev",
    password: "Password123!"
  },
  {
    username: "charlie_pm",
    email: "charlie@boardcollab.dev",
    password: "Password123!"
  },
  {
    username: "dana_engineer",
    email: "dana@boardcollab.dev",
    password: "Password123!"
  },
  {
    username: "evan_architect",
    email: "evan@boardcollab.dev",
    password: "Password123!"
  }
];

export async function seedUsers() {
  await connectDB();

  logger.info("[Seed] Seeding 5 test users...");
  const seeded = [];

  for (const testUser of TEST_USERS) {
    const existing = await User.findOne({ email: testUser.email });
    if (!existing) {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(testUser.password, salt);
      const user = await User.create({
        username: testUser.username,
        email: testUser.email,
        passwordHash,
        lastSeenAt: new Date()
      });
      logger.info(`[Seed] Created test user: ${user.username} (${user.email})`);
      seeded.push(user);
    } else {
      logger.info(`[Seed] Test user already exists: ${existing.username} (${existing.email})`);
      seeded.push(existing);
    }
  }

  logger.info(`[Seed] Successfully verified ${seeded.length} test users.`);
  return seeded;
}

// Allow running directly via `node src/seed.js`
if (process.argv[1] && process.argv[1].endsWith("seed.js")) {
  seedUsers()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      logger.error("[Seed] Error seeding users:", { error: err.message });
      await disconnectDB();
      process.exit(1);
    });
}

export default seedUsers;
