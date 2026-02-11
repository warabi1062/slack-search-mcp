import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerGetMessageTool } from "./tools/get-message.js";
import { registerGetThreadTool } from "./tools/get-thread.js";
import { registerGetContextTool } from "./tools/get-context.js";
import { registerSearchMessagesTool } from "./tools/search-messages.js";

const server = new McpServer({
  name: "slack-search-mcp",
  version: "1.0.0",
});

registerGetMessageTool(server);
registerGetThreadTool(server);
registerGetContextTool(server);
registerSearchMessagesTool(server);

const transport = new StdioServerTransport();
await server.connect(transport);

console.error("slack-search-mcp server running on stdio");
