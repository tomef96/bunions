import html from "@elysiajs/html";
import { randomUUID } from "crypto";
import { Elysia, t } from "elysia";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function Page({ children }: any) {
  return (
    <html>
      <head>
        <title>Bunions</title>
        <script
          src="https://unpkg.com/htmx.org@1.9.5"
          integrity="sha384-xcuj3WpfgjlKF+FXhSQFQ0ZNr39ln+hwjN3npfM9VBnUskLolQAcN80McRIVOPuO"
          crossorigin="anonymous"
        ></script>
      </head>
      <body hx-boost="true">
        <nav style="display: flex; flex-direction: row; gap: 1rem;">
          <a href="/">Home</a>
          <a href="/player">Watch cute bunny video</a>
          <a href="/todos">Manage your todo list</a>
        </nav>
        {children}
      </body>
    </html>
  );
}

type Todo = {
  id: string;
  description: string;
};

function TodoItem({ id, description }: any) {
  return (
    <li>
      {description}{" "}
      <button
        hx-delete={`/todos/${id}`}
        hx-target="closest li"
        hx-swap="delete"
      >
        X
      </button>
    </li>
  );
}

const todos = new Elysia({ prefix: "/todos" })
  .get("/", async () => {
    const todos = await prisma.todo.findMany({
      orderBy: { created_at: "desc" },
    });

    return (
      <Page>
        <h1>Todos</h1>
        <form hx-post="/todos" hx-target="#todo-list" hx-swap="afterbegin">
          <input name="description"></input>
          <button>Add todo</button>
        </form>

        <ul id="todo-list">
          {todos.map((v) => (
            <TodoItem {...v} />
          ))}
        </ul>
      </Page>
    );
  })
  .post(
    "/",
    async ({ body }) => {
      const todo = await prisma.todo.create({ data: body });

      return <TodoItem {...todo} />;
    },
    {
      body: t.Object({
        description: t.String(),
      }),
    }
  )
  .delete("/:id", async ({ params }) => {
    await prisma.todo.delete({ where: { id: params.id } });
  });

const root = new Elysia()
  .use(html)
  .get("/", () => (
    <Page>
      <h1>Hello from Bun + Elysia!</h1>
    </Page>
  ))
  .get("/player", () => (
    <Page>
      <video controls="true" width="800" src="/video"></video>
    </Page>
  ))
  .get("/video", () => Bun.file("./bunny.mp4"))
  .use(todos)
  .listen(3000);

console.log(`Listening on localhost:${root.server?.port}`);
