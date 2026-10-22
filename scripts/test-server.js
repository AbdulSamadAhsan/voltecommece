import { MongoMemoryReplSet } from "mongodb-memory-server";
import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
const mongo = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
const port = process.env.PORT || "3100";
const env = {
  ...process.env,
  MONGODB_URI: mongo.getUri(),
  AUTH_SECRET: randomBytes(32).toString("hex"),
  AUTH_URL: `http://localhost:${port}`,
  NEXT_PUBLIC_SITE_URL: `http://localhost:${port}`,
  SEED_ADMIN_EMAIL: "admin@example.test",
  SEED_ADMIN_PASSWORD: "Test-only-password-2026",
  CRON_SECRET: randomBytes(32).toString("hex"),
};
const seed = spawn(process.execPath, ["scripts/seed.js"], {
  env,
  stdio: "inherit",
});
const code = await new Promise((resolve) => seed.on("exit", resolve));
if (code) throw Error("Seed failed");
const maintenance = spawn(
  process.execPath,
  [
    "--input-type=module",
    "-e",
    "import {maintainOrders} from './lib/orders.js';import mongoose from 'mongoose';await maintainOrders();await mongoose.disconnect();",
  ],
  { env, stdio: "inherit" },
);
await new Promise((resolve) => maintenance.on("exit", resolve));
const child = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "start", "-p", port],
  { env, stdio: "inherit" },
);
async function stop() {
  child.kill();
  await mongo.stop();
  process.exit(0);
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
child.on("exit", async () => {
  await mongo.stop();
});
