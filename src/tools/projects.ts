import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api, safeUpdate } from "../api.js";

/**
 * 프로젝트 관련 MCP 툴을 서버에 등록한다.
 *
 * @param server - 툴을 등록할 MCP 서버 인스턴스
 */
export function registerProjectTools(server: McpServer) {
  /**
   * 전체 프로젝트 목록을 반환한다.
   */
  server.registerTool("projects_list", { description: "List all projects" }, async () => {
    const data = await api("GET", "/projects");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  /**
   * ID로 단일 프로젝트를 조회한다.
   *
   * @param project_id - 조회할 프로젝트 ID
   */
  server.registerTool(
    "projects_get",
    {
      description: "Get a single project by ID",
      inputSchema: { project_id: z.number().describe("Project ID") },
    },
    async ({ project_id }) => {
      const data = await api("GET", `/projects/${project_id}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  /**
   * 새 프로젝트를 생성한다.
   *
   * @param title - 프로젝트 이름
   * @param description - 프로젝트 설명 (선택)
   * @param parent_project_id - 부모 프로젝트 ID (선택, 하위 프로젝트로 생성 시 사용)
   * @param is_archived - 아카이브 여부 (선택)
   */
  server.registerTool(
    "projects_create",
    {
      description: "Create a new project",
      inputSchema: {
        title: z.string().describe("Project title"),
        description: z.string().optional().describe("Project description"),
        parent_project_id: z.number().optional().describe("Parent project ID (to create as sub-project)"),
        is_archived: z.boolean().optional().describe("Archive the project"),
      },
    },
    async ({ title, description, parent_project_id, is_archived }) => {
      const body: Record<string, unknown> = { title };
      if (description !== undefined) body.description = description;
      if (parent_project_id !== undefined) body.parent_project_id = parent_project_id;
      if (is_archived !== undefined) body.is_archived = is_archived;
      const data = await api("PUT", "/projects", body);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  /**
   * 프로젝트를 수정한다. 전달한 필드만 변경되며 나머지는 보존된다.
   * parent_project_id를 변경하면 다른 프로젝트의 하위로 이동할 수 있다.
   *
   * @param project_id - 수정할 프로젝트 ID
   * @param title - 새 이름 (선택)
   * @param description - 새 설명 (선택)
   * @param parent_project_id - 새 부모 프로젝트 ID (선택, 0이면 최상위로 이동)
   * @param is_archived - 아카이브/언아카이브 (선택)
   */
  server.registerTool(
    "projects_update",
    {
      description: "Update a project (rename, move to another parent, archive, etc.)",
      inputSchema: {
        project_id: z.number().describe("Project ID"),
        title: z.string().optional().describe("New title"),
        description: z.string().optional().describe("New description"),
        parent_project_id: z.number().optional().describe("New parent project ID (0 to make top-level)"),
        is_archived: z.boolean().optional().describe("Archive or unarchive"),
      },
    },
    async ({ project_id, ...patch }) => {
      const data = await safeUpdate(`/projects/${project_id}`, patch as Record<string, unknown>);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  /**
   * 프로젝트를 삭제한다. 하위 태스크도 함께 삭제되므로 주의.
   *
   * @param project_id - 삭제할 프로젝트 ID
   */
  server.registerTool(
    "projects_delete",
    {
      description: "Delete a project",
      inputSchema: { project_id: z.number().describe("Project ID") },
    },
    async ({ project_id }) => {
      await api("DELETE", `/projects/${project_id}`);
      return { content: [{ type: "text", text: `Project ${project_id} deleted.` }] };
    }
  );

  /**
   * 프로젝트를 복제한다.
   *
   * @param project_id - 복제할 원본 프로젝트 ID
   * @param project_duplicate_destination_id - 복제본을 넣을 대상 프로젝트 ID (선택)
   */
  server.registerTool(
    "projects_duplicate",
    {
      description: "Duplicate a project",
      inputSchema: {
        project_id: z.number().describe("Project ID to duplicate"),
        project_duplicate_destination_id: z.number().optional().describe("Destination project ID"),
      },
    },
    async ({ project_id, project_duplicate_destination_id }) => {
      const body: Record<string, unknown> = {};
      if (project_duplicate_destination_id !== undefined) body.project_duplicate_destination_id = project_duplicate_destination_id;
      const data = await api("PUT", `/projects/${project_id}/duplicate`, body);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}
