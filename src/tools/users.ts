import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { api } from "../api.js";

/**
 * 유저 관련 MCP 툴을 서버에 등록한다.
 *
 * @param server - 툴을 등록할 MCP 서버 인스턴스
 */
export function registerUserTools(server: McpServer) {
  /**
   * 현재 인증된 유저 정보를 반환한다.
   */
  server.registerTool("users_me", { description: "Get current user info" }, async () => {
    const data = await api("GET", "/user");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  });

  /**
   * 이름 또는 이메일로 유저를 검색한다.
   * 담당자 추가 시 유저 ID를 찾는 데 사용한다.
   *
   * @param s - 검색 키워드 (이름 또는 이메일)
   */
  server.registerTool(
    "users_search",
    {
      description: "Search for users by name or email (useful for finding user IDs for assignees)",
      inputSchema: { s: z.string().describe("Search query") },
    },
    async ({ s }) => {
      const data = await api("GET", `/users?s=${encodeURIComponent(s)}`);
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
  );
}
