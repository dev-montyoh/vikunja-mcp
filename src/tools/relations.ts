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

/**
 * 태스크 관계(relation) 관련 MCP 툴을 서버에 등록한다.
 *
 * @param server - 툴을 등록할 MCP 서버 인스턴스
 */
export function registerRelationTools(server: McpServer) {
  /**
   * 두 태스크 사이에 관계를 추가한다.
   *
   * @param task_id - 기준 태스크 ID
   * @param other_task_id - 연결할 상대 태스크 ID
   * @param relation_kind - 관계 유형 (subtask, blocking, related 등 12가지)
   */
  server.registerTool(
    "task_relations_add",
    {
      description: "Add a relation between two tasks",
      inputSchema: {
        task_id: z.number().describe("Source task ID"),
        other_task_id: z.number().describe("Related task ID"),
        relation_kind: RelationKind.describe("Relation type"),
      },
    },
    async ({ task_id, other_task_id, relation_kind }) => {
      const data = await api("PUT", `/tasks/${task_id}/relations`, { other_task_id, relation_kind });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  /**
   * 두 태스크 사이의 관계를 제거한다.
   *
   * @param task_id - 기준 태스크 ID
   * @param other_task_id - 연결 해제할 상대 태스크 ID
   * @param relation_kind - 제거할 관계 유형
   */
  server.registerTool(
    "task_relations_remove",
    {
      description: "Remove a relation between two tasks",
      inputSchema: {
        task_id: z.number().describe("Source task ID"),
        other_task_id: z.number().describe("Related task ID"),
        relation_kind: z.string().describe("Relation type (e.g. subtask, related, blocking)"),
      },
    },
    async ({ task_id, other_task_id, relation_kind }) => {
      await api("DELETE", `/tasks/${task_id}/relations/${relation_kind}/${other_task_id}`);
      return { content: [{ type: "text", text: "Relation removed." }] };
    }
  );
}
