# slack-search-mcp

Slack のメッセージ検索・スレッド読み込みを行う MCP (Model Context Protocol) サーバー。

## 機能

### 1. メッセージ取得 (`get_message`)
Slack メッセージの URL から対象メッセージを取得する。

- URL 例: `https://your-workspace.slack.com/archives/C01ABCDEFGH/p1234567890123456`
- URL からチャンネル ID とメッセージ timestamp を抽出
- `conversations.history` API でメッセージ本文・投稿者・リアクションなどを返す

### 2. スレッド読み込み (`get_thread`)
指定メッセージのスレッド（返信一覧）を取得する。

- メッセージ URL またはチャンネル ID + timestamp を指定
- `conversations.replies` API でスレッド内の全メッセージを返す

## 技術スタック

- **ランタイム**: Node.js (>=18)
- **言語**: TypeScript
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **Slack API**: `@slack/web-api`

## セットアップ

### 1. Slack App の作成

1. https://api.slack.com/apps で新しい App を作成
2. **OAuth & Permissions** で以下の Bot Token Scopes を付与:
   - `channels:history` — パブリックチャンネルのメッセージ読み取り
   - `groups:history` — プライベートチャンネルのメッセージ読み取り
   - `im:history` — DM のメッセージ読み取り
   - `mpim:history` — グループ DM のメッセージ読み取り
3. ワークスペースにインストールし、Bot User OAuth Token (`xoxb-...`) を控える

### 2. 環境変数

```bash
export SLACK_BOT_TOKEN=xoxb-your-bot-token
```

### 3. インストール・ビルド

```bash
pnpm install
pnpm run build
```

### 4. MCP クライアントへの登録

Claude Desktop の設定例 (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "slack-search": {
      "command": "node",
      "args": ["<path-to-repo>/dist/index.js"],
      "env": {
        "SLACK_BOT_TOKEN": "xoxb-your-bot-token"
      }
    }
  }
}
```

## 開発

```bash
pnpm install
pnpm run dev      # ts-node で直接実行
pnpm run build    # TypeScript コンパイル
pnpm run lint     # ESLint
```

## ツール仕様

### `get_message`

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| `url` | string | はい | Slack メッセージの URL |

**レスポンス**: メッセージオブジェクト (投稿者、本文、timestamp、リアクションなど)

### `get_thread`

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| `url` | string | `channel` + `ts` 未指定時は必須 | Slack メッセージの URL |
| `channel` | string | `url` 未指定時は必須 | チャンネル ID |
| `ts` | string | `url` 未指定時は必須 | 親メッセージの timestamp |

**レスポンス**: スレッド内メッセージの配列

## Slack メッセージ URL の構造

```
https://<workspace>.slack.com/archives/<channel_id>/p<timestamp_without_dot>
```

- `channel_id`: `C01ABCDEFGH` のようなチャンネル ID
- `p<timestamp>`: `p1234567890123456` → API 用 timestamp は `1234567890.123456`（末尾6桁の前にドットを挿入）

## ライセンス

MIT
