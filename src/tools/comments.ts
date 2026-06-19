import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api } from "../api.js";

export function registerCommentTools(server: McpServer) {
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
}
