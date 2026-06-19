import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api, safeUpdate } from "../api.js";

/**
 * 태스크 관련 MCP 툴을 서버에 등록한다.
 *
 * @param server - 툴을 등록할 MCP 서버 인스턴스
 */
export function registerTaskTools(server: McpServer) {
  /**
   * 프로젝트 내 태스크 목록을 반환한다.
   *
   * @param project_id - 조회할 프로젝트 ID
   * @param page - 페이지 번호 (선택, 기본값 1)
   * @param per_page - 페이지당 항목 수 (선택)
   * @param s - 검색 키워드 (선택)
   * @param sort_by - 정렬 기준 필드 (선택, e.g. position, created, due_date)
   * @param order_by - 정렬 방향 (선택, asc 또는 desc)
   * @param filter - 필터 표현식 (선택)
   */
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

  /**
   * ID로 단일 태스크를 조회한다.
   *
   * @param task_id - 조회할 태스크 ID
   */
  server.tool(
    "tasks_get",
    "Get a single task by ID",
    { task_id: z.number().describe("Task ID") },
    async ({ task_id }) => {
      const data = await api("GET", `/tasks/${task_id}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  /**
   * 프로젝트에 새 태스크를 생성한다.
   *
   * @param project_id - 태스크를 생성할 프로젝트 ID
   * @param title - 태스크 제목
   * @param description - 태스크 본문 (선택, HTML 지원)
   * @param priority - 우선순위 0–5 (선택)
   * @param due_date - 마감일 ISO 8601 (선택)
   * @param start_date - 시작일 ISO 8601 (선택)
   * @param end_date - 종료일 ISO 8601 (선택)
   * @param percent_done - 완료 퍼센트 0–100 (선택)
   * @param repeat_after - 반복 간격 초 단위 (선택)
   */
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

  /**
   * 태스크를 수정한다. 전달한 필드만 변경되며 description 등 나머지는 보존된다.
   * project_id를 변경하면 다른 프로젝트로 태스크를 이동할 수 있다.
   *
   * @param task_id - 수정할 태스크 ID
   * @param title - 새 제목 (선택)
   * @param description - 새 본문 (선택, HTML 지원)
   * @param done - 완료 여부 (선택)
   * @param priority - 우선순위 0–5 (선택)
   * @param due_date - 마감일 ISO 8601 (선택)
   * @param start_date - 시작일 ISO 8601 (선택)
   * @param end_date - 종료일 ISO 8601 (선택)
   * @param percent_done - 완료 퍼센트 0–100 (선택)
   * @param repeat_after - 반복 간격 초 단위 (선택)
   * @param project_id - 이동할 프로젝트 ID (선택)
   */
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

  /**
   * 태스크를 삭제한다.
   *
   * @param task_id - 삭제할 태스크 ID
   */
  server.tool(
    "tasks_delete",
    "Delete a task",
    { task_id: z.number().describe("Task ID") },
    async ({ task_id }) => {
      await api("DELETE", `/tasks/${task_id}`);
      return { content: [{ type: "text", text: `Task ${task_id} deleted.` }] };
    }
  );

  /**
   * 태스크의 순서(position)를 변경한다.
   * 전용 엔드포인트(POST /tasks/{id}/position)를 사용하므로 다른 필드에 영향을 주지 않는다.
   *
   * @param task_id - 순서를 변경할 태스크 ID
   * @param position - 새 position 값 (값이 낮을수록 목록 상단)
   * @param project_view_id - 프로젝트 뷰 ID (선택)
   */
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

  /**
   * 태스크를 복제한다.
   *
   * @param task_id - 복제할 원본 태스크 ID
   * @param project_id - 복제본을 생성할 프로젝트 ID (선택, 기본값: 원본과 동일 프로젝트)
   */
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
