import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";
import { db } from "./db";
import { todos } from "./db/schema";

const app = new Elysia().use(openapi());

app.get("/", () => Response.json({ message: "Hello Elysia" }));

app.get("/todos", async () => {
  const rows = await db.select().from(todos);
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    completed: row.completed,
    createdAt: row.createdAt,
  }));
});

app.listen(3010);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
