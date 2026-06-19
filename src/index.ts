import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerProjectTools } from "./tools/projects.js";
import { registerTaskTools } from "./tools/tasks.js";
import { registerCommentTools } from "./tools/comments.js";
import { registerLabelTools } from "./tools/labels.js";
import { registerAssigneeTools } from "./tools/assignees.js";
import { registerRelationTools } from "./tools/relations.js";
import { registerUserTools } from "./tools/users.js";

const server = new McpServer({
  name: "vikunja-mcp",
  version: "1.0.0",
});

registerProjectTools(server);
registerTaskTools(server);
registerCommentTools(server);
registerLabelTools(server);
registerAssigneeTools(server);
registerRelationTools(server);
registerUserTools(server);

const transport = new StdioServerTransport();
await server.connect(transport);
