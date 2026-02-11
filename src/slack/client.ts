import { WebClient } from "@slack/web-api";

export class SlackApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SlackApiError";
  }
}

let botClient: WebClient | null = null;
let userClient: WebClient | null = null;

export function getBotClient(): WebClient {
  if (botClient) return botClient;

  const token = process.env.SLACK_SEARCH_MCP_BOT_TOKEN;
  if (!token) {
    throw new SlackApiError(
      "SLACK_SEARCH_MCP_BOT_TOKEN environment variable is not set. Please set it to your Slack Bot token (xoxb-...)."
    );
  }

  botClient = new WebClient(token);
  return botClient;
}

export function getUserClient(): WebClient {
  if (userClient) return userClient;

  const token = process.env.SLACK_SEARCH_MCP_USER_TOKEN;
  if (!token) {
    throw new SlackApiError(
      "SLACK_SEARCH_MCP_USER_TOKEN environment variable is not set. Please set it to your Slack User token (xoxp-...)."
    );
  }

  userClient = new WebClient(token);
  return userClient;
}

async function autoJoin(channelId: string): Promise<void> {
  const slack = getBotClient();
  try {
    await slack.conversations.join({ channel: channelId });
  } catch (error: unknown) {
    throw new SlackApiError(
      `Failed to auto-join channel ${channelId}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function isNotInChannelError(error: unknown): boolean {
  return error instanceof Error && error.message.includes("not_in_channel");
}

async function withAutoJoin<T>(
  channelId: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error: unknown) {
    if (isNotInChannelError(error)) {
      await autoJoin(channelId);
      return await fn();
    }
    throw error;
  }
}

export async function fetchMessage(
  channelId: string,
  timestamp: string
): Promise<Record<string, unknown>> {
  const slack = getBotClient();

  try {
    return await withAutoJoin(channelId, async () => {
      const result = await slack.conversations.history({
        channel: channelId,
        latest: timestamp,
        inclusive: true,
        limit: 1,
      });

      const message = result.messages?.[0];
      if (!message) {
        throw new SlackApiError(
          `Message not found: channel=${channelId}, ts=${timestamp}`
        );
      }

      return message as Record<string, unknown>;
    });
  } catch (error: unknown) {
    if (error instanceof SlackApiError) throw error;
    throw new SlackApiError(formatSlackError(error));
  }
}

export async function fetchThread(
  channelId: string,
  threadTs: string
): Promise<Record<string, unknown>[]> {
  const slack = getBotClient();

  try {
    return await withAutoJoin(channelId, async () => {
      const result = await slack.conversations.replies({
        channel: channelId,
        ts: threadTs,
      });

      if (!result.messages || result.messages.length === 0) {
        throw new SlackApiError(
          `Thread not found: channel=${channelId}, ts=${threadTs}`
        );
      }

      return result.messages as Record<string, unknown>[];
    });
  } catch (error: unknown) {
    if (error instanceof SlackApiError) throw error;
    throw new SlackApiError(formatSlackError(error));
  }
}

export async function fetchContext(
  channelId: string,
  timestamp: string,
  count: number
): Promise<{ before: Record<string, unknown>[]; target: Record<string, unknown> | null; after: Record<string, unknown>[] }> {
  const slack = getBotClient();

  try {
    return await withAutoJoin(channelId, async () => {
      const beforeResult = await slack.conversations.history({
        channel: channelId,
        latest: timestamp,
        inclusive: true,
        limit: count + 1,
      });

      const afterResult = await slack.conversations.history({
        channel: channelId,
        oldest: timestamp,
        inclusive: false,
        limit: count,
      });

      const beforeMessages = (beforeResult.messages ?? []) as Record<string, unknown>[];
      const afterMessages = (afterResult.messages ?? []) as Record<string, unknown>[];

      const target = beforeMessages.length > 0 ? beforeMessages[0] : null;
      const before = beforeMessages.slice(1).reverse();
      const after = [...afterMessages].reverse();

      return { before, target, after };
    });
  } catch (error: unknown) {
    if (error instanceof SlackApiError) throw error;
    throw new SlackApiError(formatSlackError(error));
  }
}

export interface SearchResult {
  query: string;
  total: number;
  messages: Record<string, unknown>[];
}

export async function searchMessages(
  query: string,
  count: number,
  sort: "score" | "timestamp",
  sortDir: "asc" | "desc"
): Promise<SearchResult> {
  const slack = getUserClient();

  try {
    const result = await slack.search.messages({
      query,
      count,
      sort,
      sort_dir: sortDir,
    });

    const matches = (result.messages?.matches ?? []) as Record<string, unknown>[];
    const total = result.messages?.total ?? 0;

    return { query, total, messages: matches };
  } catch (error: unknown) {
    if (error instanceof SlackApiError) throw error;
    throw new SlackApiError(formatSlackError(error));
  }
}

function formatSlackError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message.includes("channel_not_found")) {
      return "Channel not found. Please check the channel ID.";
    }
    if (error.message.includes("invalid_auth")) {
      return "Invalid Slack token. Please check your SLACK_SEARCH_MCP_BOT_TOKEN / SLACK_SEARCH_MCP_USER_TOKEN.";
    }
    return `Slack API error: ${error.message}`;
  }
  return `Unknown Slack API error: ${String(error)}`;
}
