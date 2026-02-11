import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseSlackUrl, SlackUrlParseError } from "../utils/url-parser.js";
import { fetchMessage, SlackApiError } from "../slack/client.js";

export function registerGetMessageTool(server: McpServer): void {
  server.tool(
    "get_message",
    "Fetch a single Slack message by its URL",
    {
      url: z
        .string()
        .url()
        .describe(
          "Slack message URL (e.g. https://workspace.slack.com/archives/C1234567890/p1234567890123456)"
        ),
    },
    async ({ url }) => {
      try {
        const { channelId, timestamp } = parseSlackUrl(url);
        const message = await fetchMessage(channelId, timestamp);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(message, null, 2),
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
