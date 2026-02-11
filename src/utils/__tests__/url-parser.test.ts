import { describe, it, expect } from "vitest";
import { parseSlackUrl, SlackUrlParseError } from "../url-parser.js";

describe("parseSlackUrl", () => {
  it("parses a standard Slack message URL", () => {
    const result = parseSlackUrl(
      "https://myworkspace.slack.com/archives/C1234567890/p1234567890123456"
    );
    expect(result).toEqual({
      channelId: "C1234567890",
      timestamp: "1234567890.123456",
    });
  });

  it("parses a URL with query parameters", () => {
    const result = parseSlackUrl(
      "https://myworkspace.slack.com/archives/C1234567890/p1234567890123456?thread_ts=1234567890.123456&cid=C1234567890"
    );
    expect(result).toEqual({
      channelId: "C1234567890",
      timestamp: "1234567890.123456",
    });
  });

  it("parses a URL with hyphenated workspace name", () => {
    const result = parseSlackUrl(
      "https://my-workspace.slack.com/archives/C9876543210/p9876543210654321"
    );
    expect(result).toEqual({
      channelId: "C9876543210",
      timestamp: "9876543210.654321",
    });
  });

  it("throws SlackUrlParseError for an invalid URL", () => {
    expect(() => parseSlackUrl("https://example.com")).toThrow(
      SlackUrlParseError
    );
  });

  it("throws SlackUrlParseError for a non-Slack domain", () => {
    expect(() =>
      parseSlackUrl(
        "https://notslack.com/archives/C1234567890/p1234567890123456"
      )
    ).toThrow(SlackUrlParseError);
  });

  it("throws SlackUrlParseError for wrong timestamp length", () => {
    expect(() =>
      parseSlackUrl(
        "https://workspace.slack.com/archives/C1234567890/p12345"
      )
    ).toThrow(SlackUrlParseError);
  });

  it("throws SlackUrlParseError for missing channel ID", () => {
    expect(() =>
      parseSlackUrl("https://workspace.slack.com/archives/")
    ).toThrow(SlackUrlParseError);
  });

  it("throws SlackUrlParseError for empty string", () => {
    expect(() => parseSlackUrl("")).toThrow(SlackUrlParseError);
  });
});
