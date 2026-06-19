import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api } from "../api.js";

export function registerAssigneeTools(server: McpServer) {
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
}
