export class SlackUrlParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SlackUrlParseError";
  }
}

export interface SlackUrlParts {
  channelId: string;
  timestamp: string;
}

const SLACK_URL_REGEX =
  /^https:\/\/[a-zA-Z0-9-]+\.slack\.com\/archives\/([A-Z0-9]+)\/p(\d{16})(?:\?.*)?$/;

export function parseSlackUrl(url: string): SlackUrlParts {
  const match = url.match(SLACK_URL_REGEX);
  if (!match) {
    throw new SlackUrlParseError(
      `Invalid Slack URL: ${url}\nExpected format: https://<workspace>.slack.com/archives/<channel_id>/p<16-digit timestamp>`
    );
  }

  const channelId = match[1];
  const rawTimestamp = match[2];

  // Convert p1234567890123456 → 1234567890.123456
  const timestamp = rawTimestamp.slice(0, 10) + "." + rawTimestamp.slice(10);

  return { channelId, timestamp };
}
