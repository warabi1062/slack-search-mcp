import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { searchMessages, SlackApiError } from "../slack/client.js";

export function registerSearchMessagesTool(server: McpServer): void {
  server.tool(
    "search_messages",
    "Search Slack messages by keyword. Supports Slack search modifiers like 'in:#channel', 'from:@user', 'before:2025-01-01', 'after:2025-01-01', 'has:link', 'has:reaction', etc.",
    {
      query: z
        .string()
        .describe(
          "Search query (e.g. 'keyword', 'keyword in:#general', 'from:@user keyword')"
        ),
      count: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(20)
        .describe("Number of results to return (default: 20, max: 100)"),
      sort: z
        .enum(["score", "timestamp"])
        .default("score")
        .describe("Sort by relevance ('score') or date ('timestamp'). Default: 'score'"),
      sort_dir: z
        .enum(["asc", "desc"])
        .default("desc")
        .describe("Sort direction. Default: 'desc'"),
    },
    async ({ query, count, sort, sort_dir }) => {
      try {
        const result = await searchMessages(query, count, sort, sort_dir);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: unknown) {
        const message =
          error instanceof SlackApiError
            ? error.message
            : `Unexpected error: ${String(error)}`;

        return {
          content: [{ type: "text" as const, text: message }],
          isError: true,
        };
      }
    }
  );
}
