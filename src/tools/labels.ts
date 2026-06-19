import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api, safeUpdate } from "../api.js";

export function registerLabelTools(server: McpServer) {
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
}
