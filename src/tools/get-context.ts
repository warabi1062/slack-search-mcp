import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseSlackUrl, SlackUrlParseError } from "../utils/url-parser.js";
import { fetchContext, SlackApiError } from "../slack/client.js";

export function registerGetContextTool(server: McpServer): void {
  server.tool(
    "get_context",
    "Fetch messages surrounding a specific Slack message (before and after)",
    {
      url: z
        .string()
        .url()
        .describe(
          "Slack message URL (e.g. https://workspace.slack.com/archives/C1234567890/p1234567890123456)"
        ),
      count: z
        .number()
        .int()
        .min(1)
        .max(50)
        .default(5)
        .describe("Number of messages to fetch before and after (default: 5)"),
    },
    async ({ url, count }) => {
      try {
        const { channelId, timestamp } = parseSlackUrl(url);
        const result = await fetchContext(channelId, timestamp, count);

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
          error instanceof SlackUrlParseError || error instanceof SlackApiError
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
