import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api } from "../api.js";

/**
 * 댓글 관련 MCP 툴을 서버에 등록한다.
 *
 * @param server - 툴을 등록할 MCP 서버 인스턴스
 */
export function registerCommentTools(server: McpServer) {
  /**
   * 태스크의 댓글 목록을 반환한다.
   *
   * @param task_id - 조회할 태스크 ID
   */
  server.registerTool(
    "comments_list",
    {
      description: "List comments on a task",
      inputSchema: { task_id: z.number().describe("Task ID") },
    },
    async ({ task_id }) => {
      const data = await api("GET", `/tasks/${task_id}/comments`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  /**
   * 태스크에 댓글을 추가한다.
   *
   * @param task_id - 댓글을 달 태스크 ID
   * @param comment - 댓글 내용
   */
  server.registerTool(
    "comments_add",
    {
      description: "Add a comment to a task",
      inputSchema: {
        task_id: z.number().describe("Task ID"),
        comment: z.string().describe("Comment text"),
      },
    },
    async ({ task_id, comment }) => {
      const data = await api("PUT", `/tasks/${task_id}/comments`, { comment });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  /**
   * 댓글 내용을 수정한다.
   *
   * @param task_id - 댓글이 달린 태스크 ID
   * @param comment_id - 수정할 댓글 ID
   * @param comment - 새 댓글 내용
   */
  server.registerTool(
    "comments_update",
    {
      description: "Update a comment",
      inputSchema: {
        task_id: z.number().describe("Task ID"),
        comment_id: z.number().describe("Comment ID"),
        comment: z.string().describe("New comment text"),
      },
    },
    async ({ task_id, comment_id, comment }) => {
      const data = await api("POST", `/tasks/${task_id}/comments/${comment_id}`, { comment, id: comment_id });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  /**
   * 댓글을 삭제한다.
   *
   * @param task_id - 댓글이 달린 태스크 ID
   * @param comment_id - 삭제할 댓글 ID
   */
  server.registerTool(
    "comments_delete",
    {
      description: "Delete a comment",
      inputSchema: {
        task_id: z.number().describe("Task ID"),
        comment_id: z.number().describe("Comment ID"),
      },
    },
    async ({ task_id, comment_id }) => {
      await api("DELETE", `/tasks/${task_id}/comments/${comment_id}`);
      return { content: [{ type: "text", text: `Comment ${comment_id} deleted.` }] };
    }
  );
}
