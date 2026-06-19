import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api, safeUpdate } from "../api.js";

export function registerTaskTools(server: McpServer) {
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
}
