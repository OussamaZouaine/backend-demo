import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { todos } from "./db/schema";

const app = new Elysia();

app.get("/", () => Response.json({ message: "Hello Elysia" }));

app.get("/todos", async () => {
  const rows = await db.select().from(todos);
  return rows.map((row) => ({
    id: String(row.id),
    title: row.title,
    completed: row.completed,
    createdAt: row.createdAt.getTime(),
  }));
});

app.post(
  "/todos",
  async ({ body }) => {
    const title = body.title.trim();
    if (!title) {
      return Response.json({ error: "title is required" }, { status: 400 });
    }
    const [row] = await db.insert(todos).values({ title }).returning();
    return {
      id: String(row.id),
      title: row.title,
      completed: row.completed,
      createdAt: row.createdAt.getTime(),
    };
  },
  {
    body: t.Object({
      title: t.String(),
    }),
  },
);

app.patch(
  "/todos/:id",
  async ({ params, body }) => {
    const id = Number.parseInt(params.id, 10);
    if (Number.isNaN(id)) {
      return Response.json({ error: "invalid id" }, { status: 400 });
    }
    const [row] = await db
      .update(todos)
      .set({ completed: body.completed })
      .where(eq(todos.id, id))
      .returning();
    if (!row) {
      return Response.json({ error: "not found" }, { status: 404 });
    }
    return {
      id: String(row.id),
      title: row.title,
      completed: row.completed,
      createdAt: row.createdAt.getTime(),
    };
  },
  {
    body: t.Object({
      completed: t.Boolean(),
    }),
  },
);

app.delete("/todos/:id", async ({ params }) => {
  const id = Number.parseInt(params.id, 10);
  if (Number.isNaN(id)) {
    return Response.json({ error: "invalid id" }, { status: 400 });
  }
  const [row] = await db.delete(todos).where(eq(todos.id, id)).returning();
  if (!row) {
    return Response.json({ error: "not found" }, { status: 404 });
  }
  return new Response(null, { status: 204 });
});

app.listen({
  port: 3010,
  hostname: "0.0.0.0",
});

console.log(
  `🦊 Elysia is running at http://${app.server?.hostname}:${app.server?.port}`,
);
