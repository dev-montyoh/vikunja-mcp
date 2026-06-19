import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api } from "../api.js";

export function registerUserTools(server: McpServer) {
  server.tool("users_me", "Get current user info", {}, async () => {
    const data = await api("GET", "/user");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  server.tool(
    "users_search",
    "Search for users by name or email (useful for finding user IDs for assignees)",
    { s: z.string().describe("Search query") },
    async ({ s }) => {
      const data = await api("GET", `/users?s=${encodeURIComponent(s)}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}
