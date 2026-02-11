# slack-search-mcp

Slack のメッセージ検索・スレッド読み込みを行う MCP (Model Context Protocol) サーバー。

## 機能

### 1. メッセージ取得 (`get_message`)
Slack メッセージの URL から対象メッセージを取得する。

- URL からチャンネル ID とメッセージ timestamp を抽出
- `conversations.history` API でメッセージ本文・投稿者・リアクションなどを返す
- Bot が未参加のチャンネルには自動で参加してから取得

### 2. スレッド読み込み (`get_thread`)
指定メッセージのスレッド（返信一覧）を取得する。

- メッセージ URL またはチャンネル ID + timestamp を指定
- `conversations.replies` API でスレッド内の全メッセージを返す

### 3. 前後の会話取得 (`get_context`)
指定メッセージの前後の会話を取得する。

- メッセージ URL と取得件数を指定
- 対象メッセージの前後 N 件のメッセージを時系列順で返す

### 4. キーワード検索 (`search_messages`)
Slack メッセージをキーワードで検索する。

- Slack の検索修飾子（`in:#channel`, `from:@user`, `before:`, `after:` など）に対応
- 関連度順 (`score`) または日時順 (`timestamp`) でソート可能

## 技術スタック

- **ランタイム**: Node.js (>=18)
- **言語**: TypeScript
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **Slack API**: `@slack/web-api`

## セットアップ

### 1. Slack App の作成

1. https://api.slack.com/apps で新しい App を作成
2. **OAuth & Permissions** で以下の Scopes を付与:

   **Bot Token Scopes:**
   | Scope | 用途 | 必須 |
   |-------|------|------|
   | `channels:history` | パブリックチャンネルのメッセージ取得 | はい |
   | `channels:join` | パブリックチャンネルへの自動参加 | はい |
   | `groups:history` | プライベートチャンネルのメッセージ取得 | 任意 |
   | `im:history` | DM のメッセージ取得 | 任意 |
   | `mpim:history` | グループ DM のメッセージ取得 | 任意 |

   **User Token Scopes:**
   | Scope | 用途 | 必須 |
   |-------|------|------|
   | `search:read` | キーワード検索 | はい |

3. ワークスペースにインストールし、以下のトークンを控える:
   - **Bot User OAuth Token** (`xoxb-...`)
   - **User OAuth Token** (`xoxp-...`)

### 2. 環境変数

```bash
export SLACK_BOT_TOKEN=xoxb-your-bot-token
export SLACK_USER_TOKEN=xoxp-your-user-token
```

- `SLACK_BOT_TOKEN`: メッセージ取得・スレッド取得・前後の会話取得に使用
- `SLACK_USER_TOKEN`: キーワード検索に使用

### 3. インストール・ビルド

```bash
pnpm install
pnpm run build
```

### 4. MCP クライアントへの登録

Claude Code の場合:

```bash
claude mcp add -s project \
  -e 'SLACK_BOT_TOKEN=${SLACK_BOT_TOKEN}' \
  -e 'SLACK_USER_TOKEN=${SLACK_USER_TOKEN}' \
  -- slack-search-mcp node <path-to-repo>/dist/index.js
```

または `.mcp.json` を直接編集:

```json
{
  "mcpServers": {
    "slack-search-mcp": {
      "type": "stdio",
      "command": "node",
      "args": ["<path-to-repo>/dist/index.js"],
      "env": {
        "SLACK_BOT_TOKEN": "${SLACK_BOT_TOKEN}",
        "SLACK_USER_TOKEN": "${SLACK_USER_TOKEN}"
      }
    }
  }
}
```

## 開発

```bash
pnpm install
pnpm run dev      # tsx で直接実行
pnpm run build    # TypeScript コンパイル
pnpm test         # テスト実行
```

## ツール仕様

### `get_message`

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| `url` | string | はい | Slack メッセージの URL |

### `get_thread`

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| `url` | string | `channel` + `ts` 未指定時は必須 | Slack メッセージの URL |
| `channel` | string | `url` 未指定時は必須 | チャンネル ID |
| `ts` | string | `url` 未指定時は必須 | 親メッセージの timestamp |

### `get_context`

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| `url` | string | はい | Slack メッセージの URL |
| `count` | number | いいえ | 前後の取得件数 (デフォルト: 5, 最大: 50) |

### `search_messages`

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| `query` | string | はい | 検索クエリ（Slack 検索修飾子対応） |
| `count` | number | いいえ | 取得件数 (デフォルト: 20, 最大: 100) |
| `sort` | string | いいえ | ソート順: `score`（関連度）or `timestamp`（日時）。デフォルト: `score` |
| `sort_dir` | string | いいえ | ソート方向: `asc` or `desc`。デフォルト: `desc` |

## ライセンス

MIT
