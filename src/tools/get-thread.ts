import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { parseSlackUrl, SlackUrlParseError } from "../utils/url-parser.js";
import { fetchThread, SlackApiError } from "../slack/client.js";

export function registerGetThreadTool(server: McpServer): void {
  server.tool(
    "get_thread",
    "Fetch an entire Slack thread by URL or channel + timestamp",
    {
      url: z
        .string()
        .url()
        .optional()
        .describe(
          "Slack message URL (e.g. https://workspace.slack.com/archives/C1234567890/p1234567890123456)"
        ),
      channel: z
        .string()
        .optional()
        .describe("Slack channel ID (e.g. C1234567890)"),
      ts: z
        .string()
        .optional()
        .describe("Thread timestamp (e.g. 1234567890.123456)"),
    },
    async ({ url, channel, ts }) => {
      try {
        let channelId: string;
        let threadTs: string;

        if (url) {
          const parsed = parseSlackUrl(url);
          channelId = parsed.channelId;
          threadTs = parsed.timestamp;
        } else if (channel && ts) {
          channelId = channel;
          threadTs = ts;
        } else {
          return {
            content: [
              {
                type: "text" as const,
                text: "Either 'url' or both 'channel' and 'ts' must be provided.",
              },
            ],
            isError: true,
          };
        }

        const messages = await fetchThread(channelId, threadTs);

        return {
          content: [
            {
              type: "text" as const,
              text: JSON.stringify(messages, null, 2),
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
