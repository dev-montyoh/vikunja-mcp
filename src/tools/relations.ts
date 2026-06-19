import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api } from "../api.js";

const RelationKind = z.enum([
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
]);

export function registerRelationTools(server: McpServer) {
  server.tool(
    "task_relations_add",
    "Add a relation between two tasks",
    {
      task_id: z.number().describe("Source task ID"),
      other_task_id: z.number().describe("Related task ID"),
      relation_kind: RelationKind.describe("Relation type"),
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
      return { content: [{ type: "text", text: "Relation removed." }] };
    }
  );
}
