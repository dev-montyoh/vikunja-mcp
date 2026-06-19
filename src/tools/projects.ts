import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api, safeUpdate } from "../api.js";

export function registerProjectTools(server: McpServer) {
  server.tool("projects_list", "List all projects", {}, async () => {
    const data = await api("GET", "/projects");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool(
    "projects_get",
    "Get a single project by ID",
    { project_id: z.number().describe("Project ID") },
    async ({ project_id }) => {
      const data = await api("GET", `/projects/${project_id}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "projects_create",
    "Create a new project",
    {
      title: z.string().describe("Project title"),
      description: z.string().optional().describe("Project description"),
      parent_project_id: z.number().optional().describe("Parent project ID (to create as sub-project)"),
      is_archived: z.boolean().optional().describe("Archive the project"),
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

  server.tool(
    "projects_update",
    "Update a project (rename, move to another parent, archive, etc.)",
    {
      project_id: z.number().describe("Project ID"),
      title: z.string().optional().describe("New title"),
      description: z.string().optional().describe("New description"),
      parent_project_id: z.number().optional().describe("New parent project ID (0 to make top-level)"),
      is_archived: z.boolean().optional().describe("Archive or unarchive"),
    },
    async ({ project_id, ...patch }) => {
      const data = await safeUpdate(`/projects/${project_id}`, patch as Record<string, unknown>);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );

  server.tool(
    "projects_delete",
    "Delete a project",
    { project_id: z.number().describe("Project ID") },
    async ({ project_id }) => {
      await api("DELETE", `/projects/${project_id}`);
      return { content: [{ type: "text", text: `Project ${project_id} deleted.` }] };
    }
  );

  server.tool(
    "projects_duplicate",
    "Duplicate a project",
    {
      project_id: z.number().describe("Project ID to duplicate"),
      project_duplicate_destination_id: z.number().optional().describe("Destination project ID"),
    },
    async ({ project_id, project_duplicate_destination_id }) => {
      const body: Record<string, unknown> = {};
      if (project_duplicate_destination_id !== undefined) body.project_duplicate_destination_id = project_duplicate_destination_id;
      const data = await api("PUT", `/projects/${project_id}/duplicate`, body);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}
