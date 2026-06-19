import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api } from "../api.js";

/**
 * 담당자(assignee) 관련 MCP 툴을 서버에 등록한다.
 *
 * @param server - 툴을 등록할 MCP 서버 인스턴스
 */
export function registerAssigneeTools(server: McpServer) {
  /**
   * 태스크의 담당자 목록을 반환한다.
   *
   * @param task_id - 조회할 태스크 ID
   */
  server.registerTool(
    "task_assignees_list",
    {
      description: "List assignees of a task",
      inputSchema: { task_id: z.number().describe("Task ID") },
    },
    async ({ task_id }) => {
      const data = await api("GET", `/tasks/${task_id}/assignees`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  /**
   * 태스크에 담당자를 추가한다. 유저 ID는 users_search로 조회할 수 있다.
   *
   * @param task_id - 담당자를 추가할 태스크 ID
   * @param user_id - 추가할 유저 ID
   */
  server.registerTool(
    "task_assignees_add",
    {
      description: "Add a user as assignee to a task",
      inputSchema: {
        task_id: z.number().describe("Task ID"),
        user_id: z.number().describe("User ID to assign"),
      },
    },
    async ({ task_id, user_id }) => {
      const data = await api("PUT", `/tasks/${task_id}/assignees`, { user_id });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  /**
   * 태스크에서 담당자를 제거한다.
   *
   * @param task_id - 담당자를 제거할 태스크 ID
   * @param user_id - 제거할 유저 ID
   */
  server.registerTool(
    "task_assignees_remove",
    {
      description: "Remove an assignee from a task",
      inputSchema: {
        task_id: z.number().describe("Task ID"),
        user_id: z.number().describe("User ID to remove"),
      },
    },
    async ({ task_id, user_id }) => {
      await api("DELETE", `/tasks/${task_id}/assignees/${user_id}`);
      return { content: [{ type: "text", text: `User ${user_id} removed from task ${task_id}.` }] };
    }
  );
}
