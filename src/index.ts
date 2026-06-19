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

  const text = await res.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

// GET 먼저 조회 후 변경 필드만 덮어써서 POST — description 등 미포함 필드 보존
async function safeUpdate<T>(path: string, patch: Record<string, unknown>): Promise<T> {
  const existing = await api<Record<string, unknown>>("GET", path);
  return api<T>("POST", path, { ...existing, ...patch });
}

const server = new McpServer({
  name: "vikunja-mcp",
  version: "1.0.0",
});

// ─── PROJECTS ────────────────────────────────────────────────────────────────

server.tool("projects_list", "List all projects", {}, async () => {
  const data = await api<{ id: number; title: string; description: string; parent_project_id: number }[]>("GET", "/projects");
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool(
  "projects_get",
  "Get a single project by ID",
  { project_id: z.number().describe("Project ID") },
  async ({ project_id }) => {
    const data = await api("GET", `/projects/${project_id}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "projects_create",
  "Create a new project",
  {
    title: z.string().describe("Project title"),
    description: z.string().optional().describe("Project description"),
    parent_project_id: z.number().optional().describe("Parent project ID (to create as sub-project)"),
    is_archived: z.boolean().optional().describe("Archive the project"),
  },
  async ({ title, description, parent_project_id, is_archived }) => {
    const body: Record<string, unknown> = { title };
    if (description !== undefined) body.description = description;
    if (parent_project_id !== undefined) body.parent_project_id = parent_project_id;
    if (is_archived !== undefined) body.is_archived = is_archived;
    const data = await api("PUT", "/projects", body);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "projects_update",
  "Update a project (rename, move to another parent, archive, etc.)",
  {
    project_id: z.number().describe("Project ID"),
    title: z.string().optional().describe("New title"),
    description: z.string().optional().describe("New description"),
    parent_project_id: z.number().optional().describe("New parent project ID (0 to make top-level)"),
    is_archived: z.boolean().optional().describe("Archive or unarchive"),
  },
  async ({ project_id, ...patch }) => {
    const data = await safeUpdate(`/projects/${project_id}`, patch as Record<string, unknown>);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "projects_delete",
  "Delete a project",
  { project_id: z.number().describe("Project ID") },
  async ({ project_id }) => {
    await api("DELETE", `/projects/${project_id}`);
    return { content: [{ type: "text", text: `Project ${project_id} deleted.` }] };
  }
);

server.tool(
  "projects_duplicate",
  "Duplicate a project",
  {
    project_id: z.number().describe("Project ID to duplicate"),
    project_duplicate_destination_id: z.number().optional().describe("Destination project ID"),
  },
  async ({ project_id, project_duplicate_destination_id }) => {
    const body: Record<string, unknown> = {};
    if (project_duplicate_destination_id !== undefined) body.project_duplicate_destination_id = project_duplicate_destination_id;
    const data = await api("PUT", `/projects/${project_id}/duplicate`, body);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ─── TASKS ───────────────────────────────────────────────────────────────────

server.tool(
  "tasks_list",
  "List tasks in a project",
  {
    project_id: z.number().describe("Project ID"),
    page: z.number().optional().describe("Page number (default: 1)"),
    per_page: z.number().optional().describe("Items per page"),
    s: z.string().optional().describe("Search query"),
    sort_by: z.string().optional().describe("Sort field (e.g. position, created, due_date)"),
    order_by: z.string().optional().describe("asc or desc"),
    filter: z.string().optional().describe("Filter expression"),
  },
  async ({ project_id, page, per_page, s, sort_by, order_by, filter }) => {
    const params = new URLSearchParams();
    if (page) params.set("page", String(page));
    if (per_page) params.set("per_page", String(per_page));
    if (s) params.set("s", s);
    if (sort_by) params.set("sort_by", sort_by);
    if (order_by) params.set("order_by", order_by);
    if (filter) params.set("filter", filter);
    const qs = params.toString() ? `?${params}` : "";
    const data = await api("GET", `/projects/${project_id}/tasks${qs}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "tasks_get",
  "Get a single task by ID",
  { task_id: z.number().describe("Task ID") },
  async ({ task_id }) => {
    const data = await api("GET", `/tasks/${task_id}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "tasks_create",
  "Create a new task in a project",
  {
    project_id: z.number().describe("Project ID"),
    title: z.string().describe("Task title"),
    description: z.string().optional().describe("Task description (HTML supported)"),
    priority: z.number().optional().describe("Priority 0–5"),
    due_date: z.string().optional().describe("Due date ISO 8601"),
    start_date: z.string().optional().describe("Start date ISO 8601"),
    end_date: z.string().optional().describe("End date ISO 8601"),
    percent_done: z.number().optional().describe("Completion percentage 0–100"),
    repeat_after: z.number().optional().describe("Repeat interval in seconds"),
  },
  async ({ project_id, title, description, priority, due_date, start_date, end_date, percent_done, repeat_after }) => {
    const body: Record<string, unknown> = { title };
    if (description !== undefined) body.description = description;
    if (priority !== undefined) body.priority = priority;
    if (due_date !== undefined) body.due_date = due_date;
    if (start_date !== undefined) body.start_date = start_date;
    if (end_date !== undefined) body.end_date = end_date;
    if (percent_done !== undefined) body.percent_done = percent_done;
    if (repeat_after !== undefined) body.repeat_after = repeat_after;
    const data = await api("PUT", `/projects/${project_id}/tasks`, body);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "tasks_update",
  "Update a task — only provided fields change, everything else (including description) is preserved",
  {
    task_id: z.number().describe("Task ID"),
    title: z.string().optional(),
    description: z.string().optional().describe("HTML supported"),
    done: z.boolean().optional(),
    priority: z.number().optional().describe("0–5"),
    due_date: z.string().optional().describe("ISO 8601"),
    start_date: z.string().optional().describe("ISO 8601"),
    end_date: z.string().optional().describe("ISO 8601"),
    percent_done: z.number().optional().describe("0–100"),
    repeat_after: z.number().optional().describe("seconds"),
    project_id: z.number().optional().describe("Move task to another project"),
  },
  async ({ task_id, ...patch }) => {
    const data = await safeUpdate(`/tasks/${task_id}`, patch as Record<string, unknown>);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "tasks_delete",
  "Delete a task",
  { task_id: z.number().describe("Task ID") },
  async ({ task_id }) => {
    await api("DELETE", `/tasks/${task_id}`);
    return { content: [{ type: "text", text: `Task ${task_id} deleted.` }] };
  }
);

server.tool(
  "tasks_set_position",
  "Change task position within a project view (for reordering)",
  {
    task_id: z.number().describe("Task ID"),
    position: z.number().describe("New position value (lower = higher in list)"),
    project_view_id: z.number().optional().describe("Project view ID (optional)"),
  },
  async ({ task_id, position, project_view_id }) => {
    const body: Record<string, unknown> = { position };
    if (project_view_id !== undefined) body.project_view_id = project_view_id;
    const data = await api("POST", `/tasks/${task_id}/position`, body);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "tasks_duplicate",
  "Duplicate a task",
  {
    task_id: z.number().describe("Task ID to duplicate"),
    project_id: z.number().optional().describe("Target project ID (defaults to same project)"),
  },
  async ({ task_id, project_id }) => {
    const body: Record<string, unknown> = {};
    if (project_id !== undefined) body.project_id = project_id;
    const data = await api("PUT", `/tasks/${task_id}/duplicate`, body);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ─── COMMENTS ────────────────────────────────────────────────────────────────

server.tool(
  "comments_list",
  "List comments on a task",
  { task_id: z.number().describe("Task ID") },
  async ({ task_id }) => {
    const data = await api("GET", `/tasks/${task_id}/comments`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "comments_add",
  "Add a comment to a task",
  {
    task_id: z.number().describe("Task ID"),
    comment: z.string().describe("Comment text"),
  },
  async ({ task_id, comment }) => {
    const data = await api("PUT", `/tasks/${task_id}/comments`, { comment });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "comments_update",
  "Update a comment",
  {
    task_id: z.number().describe("Task ID"),
    comment_id: z.number().describe("Comment ID"),
    comment: z.string().describe("New comment text"),
  },
  async ({ task_id, comment_id, comment }) => {
    const data = await api("POST", `/tasks/${task_id}/comments/${comment_id}`, { comment, id: comment_id });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "comments_delete",
  "Delete a comment",
  {
    task_id: z.number().describe("Task ID"),
    comment_id: z.number().describe("Comment ID"),
  },
  async ({ task_id, comment_id }) => {
    await api("DELETE", `/tasks/${task_id}/comments/${comment_id}`);
    return { content: [{ type: "text", text: `Comment ${comment_id} deleted.` }] };
  }
);

// ─── LABELS ──────────────────────────────────────────────────────────────────

server.tool("labels_list", "List all available labels", {}, async () => {
  const data = await api("GET", "/labels");
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool(
  "labels_create",
  "Create a new label",
  {
    title: z.string().describe("Label title"),
    description: z.string().optional().describe("Label description"),
    hex_color: z.string().optional().describe("Hex color code e.g. #ff0000"),
  },
  async ({ title, description, hex_color }) => {
    const body: Record<string, unknown> = { title };
    if (description !== undefined) body.description = description;
    if (hex_color !== undefined) body.hex_color = hex_color;
    const data = await api("PUT", "/labels", body);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "labels_update",
  "Update a label",
  {
    label_id: z.number().describe("Label ID"),
    title: z.string().optional(),
    description: z.string().optional(),
    hex_color: z.string().optional().describe("Hex color code"),
  },
  async ({ label_id, ...patch }) => {
    const data = await safeUpdate(`/labels/${label_id}`, patch as Record<string, unknown>);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "labels_delete",
  "Delete a label",
  { label_id: z.number().describe("Label ID") },
  async ({ label_id }) => {
    await api("DELETE", `/labels/${label_id}`);
    return { content: [{ type: "text", text: `Label ${label_id} deleted.` }] };
  }
);

server.tool(
  "task_labels_list",
  "List labels on a task",
  { task_id: z.number().describe("Task ID") },
  async ({ task_id }) => {
    const data = await api("GET", `/tasks/${task_id}/labels`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "task_labels_add",
  "Add a label to a task",
  {
    task_id: z.number().describe("Task ID"),
    label_id: z.number().describe("Label ID"),
  },
  async ({ task_id, label_id }) => {
    const data = await api("PUT", `/tasks/${task_id}/labels`, { label_id });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "task_labels_remove",
  "Remove a label from a task",
  {
    task_id: z.number().describe("Task ID"),
    label_id: z.number().describe("Label ID"),
  },
  async ({ task_id, label_id }) => {
    await api("DELETE", `/tasks/${task_id}/labels/${label_id}`);
    return { content: [{ type: "text", text: `Label ${label_id} removed from task ${task_id}.` }] };
  }
);

// ─── ASSIGNEES ───────────────────────────────────────────────────────────────

server.tool(
  "task_assignees_list",
  "List assignees of a task",
  { task_id: z.number().describe("Task ID") },
  async ({ task_id }) => {
    const data = await api("GET", `/tasks/${task_id}/assignees`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "task_assignees_add",
  "Add a user as assignee to a task",
  {
    task_id: z.number().describe("Task ID"),
    user_id: z.number().describe("User ID to assign"),
  },
  async ({ task_id, user_id }) => {
    const data = await api("PUT", `/tasks/${task_id}/assignees`, { user_id });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "task_assignees_remove",
  "Remove an assignee from a task",
  {
    task_id: z.number().describe("Task ID"),
    user_id: z.number().describe("User ID to remove"),
  },
  async ({ task_id, user_id }) => {
    await api("DELETE", `/tasks/${task_id}/assignees/${user_id}`);
    return { content: [{ type: "text", text: `User ${user_id} removed from task ${task_id}.` }] };
  }
);

// ─── RELATIONS ───────────────────────────────────────────────────────────────

server.tool(
  "task_relations_add",
  "Add a relation between two tasks",
  {
    task_id: z.number().describe("Source task ID"),
    other_task_id: z.number().describe("Related task ID"),
    relation_kind: z
      .enum([
        "unknown",
        "subtask",
        "parenttask",
        "related",
        "duplicateof",
        "duplicates",
        "blocking",
        "blocked",
        "precedes",
        "follows",
        "copiedfrom",
        "copiedto",
      ])
      .describe("Relation type"),
  },
  async ({ task_id, other_task_id, relation_kind }) => {
    const data = await api("PUT", `/tasks/${task_id}/relations`, { other_task_id, relation_kind });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "task_relations_remove",
  "Remove a relation between two tasks",
  {
    task_id: z.number().describe("Source task ID"),
    other_task_id: z.number().describe("Related task ID"),
    relation_kind: z.string().describe("Relation type (e.g. subtask, related, blocking)"),
  },
  async ({ task_id, other_task_id, relation_kind }) => {
    await api("DELETE", `/tasks/${task_id}/relations/${relation_kind}/${other_task_id}`);
    return { content: [{ type: "text", text: `Relation removed.` }] };
  }
);

// ─── USERS ───────────────────────────────────────────────────────────────────

server.tool("users_me", "Get current user info", {}, async () => {
  const data = await api("GET", "/user");
  return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
});

server.tool(
  "users_search",
  "Search for users by name or email (useful for finding user IDs for assignees)",
  { s: z.string().describe("Search query") },
  async ({ s }) => {
    const data = await api("GET", `/users?s=${encodeURIComponent(s)}`);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// ─── MAIN ────────────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
