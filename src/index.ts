import { Elysia } from "elysia";
import { openapi } from "@elysiajs/openapi";

const app = new Elysia().use(openapi());

app.get("/", () => Response.json({ message: "Hello Elysia" }));

app.listen(3010)

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
