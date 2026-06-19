import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const BASE_URL = process.env.VIKUNJA_URL ?? "";
const TOKEN = process.env.VIKUNJA_TOKEN ?? "";

if (!BASE_URL || !TOKEN) {
  console.error("VIKUNJA_URL and VIKUNJA_TOKEN environment variables are required");
  process.exit(1);
}

async function api<T>(method: string, path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      "Content-Type": "application/json",
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Vikunja API error ${res.status}: ${text}`);
  }

  return res.json() as Promise<T>;
}

const server = new McpServer({
  name: "vikunja-mcp",
  version: "1.0.0",
});

// projects_list
server.tool(
  "projects_list",
  "List all Vikunja projects",
  {},
  async () => {
    const projects = await api<{ id: number; title: string; description: string }[]>("GET", "/projects");
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(projects.map((p) => ({ id: p.id, title: p.title, description: p.description })), null, 2),
        },
      ],
    };
  }
);

// tasks_list
server.tool(
  "tasks_list",
  "List tasks in a project",
  {
    project_id: z.number().describe("Project ID"),
    page: z.number().optional().describe("Page number (default: 1)"),
  },
  async ({ project_id, page }) => {
    const pageParam = page ? `?page=${page}` : "";
    const tasks = await api<{ id: number; title: string; description: string; done: boolean; priority: number; position: number }[]>(
      "GET",
      `/projects/${project_id}/tasks${pageParam}`
    );
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            tasks.map((t) => ({
              id: t.id,
              title: t.title,
              description: t.description,
              done: t.done,
              priority: t.priority,
              position: t.position,
            })),
            null,
            2
          ),
        },
      ],
    };
  }
);

// tasks_get
server.tool(
  "tasks_get",
  "Get a single task by ID",
  {
    task_id: z.number().describe("Task ID"),
  },
  async ({ task_id }) => {
    const task = await api<{ id: number; title: string; description: string; done: boolean; priority: number; position: number }>(
      "GET",
      `/tasks/${task_id}`
    );
    return {
      content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
    };
  }
);

// tasks_create
server.tool(
  "tasks_create",
  "Create a new task in a project",
  {
    project_id: z.number().describe("Project ID"),
    title: z.string().describe("Task title"),
    description: z.string().optional().describe("Task description (HTML supported)"),
    priority: z.number().optional().describe("Priority (0–5)"),
    due_date: z.string().optional().describe("Due date in ISO 8601 format"),
  },
  async ({ project_id, title, description, priority, due_date }) => {
    const body: Record<string, unknown> = { title };
    if (description !== undefined) body.description = description;
    if (priority !== undefined) body.priority = priority;
    if (due_date !== undefined) body.due_date = due_date;

    const task = await api<{ id: number; title: string }>("PUT", `/projects/${project_id}/tasks`, body);
    return {
      content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
    };
  }
);

// tasks_update — PATCH를 직접 호출해 미포함 필드 보존
server.tool(
  "tasks_update",
  "Update an existing task (only provided fields are changed)",
  {
    task_id: z.number().describe("Task ID"),
    title: z.string().optional().describe("New title"),
    description: z.string().optional().describe("New description (HTML supported)"),
    done: z.boolean().optional().describe("Mark as done/undone"),
    priority: z.number().optional().describe("Priority (0–5)"),
    position: z.number().optional().describe("Position for ordering"),
    due_date: z.string().optional().describe("Due date in ISO 8601 format"),
  },
  async ({ task_id, title, description, done, priority, position, due_date }) => {
    // 기존 태스크 조회 후 변경 필드만 덮어쓰기
    const existing = await api<Record<string, unknown>>("GET", `/tasks/${task_id}`);
    const body: Record<string, unknown> = { ...existing };
    if (title !== undefined) body.title = title;
    if (description !== undefined) body.description = description;
    if (done !== undefined) body.done = done;
    if (priority !== undefined) body.priority = priority;
    if (position !== undefined) body.position = position;
    if (due_date !== undefined) body.due_date = due_date;

    const task = await api<{ id: number; title: string }>("POST", `/tasks/${task_id}`, body);
    return {
      content: [{ type: "text", text: JSON.stringify(task, null, 2) }],
    };
  }
);

// tasks_delete
server.tool(
  "tasks_delete",
  "Delete a task",
  {
    task_id: z.number().describe("Task ID"),
  },
  async ({ task_id }) => {
    await api("DELETE", `/tasks/${task_id}`);
    return {
      content: [{ type: "text", text: `Task ${task_id} deleted successfully.` }],
    };
  }
);

// comments_list
server.tool(
  "comments_list",
  "List comments on a task",
  {
    task_id: z.number().describe("Task ID"),
  },
  async ({ task_id }) => {
    const comments = await api<{ id: number; comment: string; created: string }[]>("GET", `/tasks/${task_id}/comments`);
    return {
      content: [{ type: "text", text: JSON.stringify(comments, null, 2) }],
    };
  }
);

// comments_add
server.tool(
  "comments_add",
  "Add a comment to a task",
  {
    task_id: z.number().describe("Task ID"),
    comment: z.string().describe("Comment text"),
  },
  async ({ task_id, comment }) => {
    const result = await api<{ id: number }>("PUT", `/tasks/${task_id}/comments`, { comment });
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
