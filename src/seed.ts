import { db, pg } from "./db";
import { todos } from "./db/schema";

// Idempotent: wipe todos then insert a fixed dummy set (safe to re-run).
await db.delete(todos);

await db.insert(todos).values([
  { title: "Set up PostgreSQL with Docker Compose", completed: true },
  { title: "Wire Drizzle migrations", completed: true },
  { title: "Add GET /todos to Elysia", completed: false },
  { title: "Ship the demo", completed: false },
]);

await pg.end();

console.log("Seeded todos.");
