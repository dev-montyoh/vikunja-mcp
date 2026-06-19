import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api, safeUpdate } from "../api.js";

/**
 * 라벨 관련 MCP 툴을 서버에 등록한다.
 * 전역 라벨 CRUD와 태스크-라벨 연결/해제 툴을 포함한다.
 *
 * @param server - 툴을 등록할 MCP 서버 인스턴스
 */
export function registerLabelTools(server: McpServer) {
  /**
   * 사용 가능한 전체 라벨 목록을 반환한다.
   */
  server.tool("labels_list", "List all available labels", {}, async () => {
    const data = await api("GET", "/labels");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  /**
   * 새 라벨을 생성한다.
   *
   * @param title - 라벨 이름
   * @param description - 라벨 설명 (선택)
   * @param hex_color - 라벨 색상 hex 코드 (선택, e.g. #ff0000)
   */
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

  /**
   * 라벨을 수정한다. 전달한 필드만 변경되며 나머지는 보존된다.
   *
   * @param label_id - 수정할 라벨 ID
   * @param title - 새 이름 (선택)
   * @param description - 새 설명 (선택)
   * @param hex_color - 새 색상 hex 코드 (선택)
   */
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

  /**
   * 라벨을 삭제한다.
   *
   * @param label_id - 삭제할 라벨 ID
   */
  server.tool(
    "labels_delete",
    "Delete a label",
    { label_id: z.number().describe("Label ID") },
    async ({ label_id }) => {
      await api("DELETE", `/labels/${label_id}`);
      return { content: [{ type: "text", text: `Label ${label_id} deleted.` }] };
    }
  );

  /**
   * 태스크에 붙어있는 라벨 목록을 반환한다.
   *
   * @param task_id - 조회할 태스크 ID
   */
  server.tool(
    "task_labels_list",
    "List labels on a task",
    { task_id: z.number().describe("Task ID") },
    async ({ task_id }) => {
      const data = await api("GET", `/tasks/${task_id}/labels`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  /**
   * 태스크에 라벨을 추가한다.
   *
   * @param task_id - 라벨을 추가할 태스크 ID
   * @param label_id - 추가할 라벨 ID
   */
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

  /**
   * 태스크에서 라벨을 제거한다.
   *
   * @param task_id - 라벨을 제거할 태스크 ID
   * @param label_id - 제거할 라벨 ID
   */
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
