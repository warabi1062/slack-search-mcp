# slack-search-mcp

Slack のメッセージ検索・スレッド読み込みを行う Claude Code プラグイン (MCP サーバー)。

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

### 2. 環境変数の設定

シェルの設定ファイル（`.bashrc`, `.zshrc` 等）にトークンを追加:

```bash
export SLACK_BOT_TOKEN=xoxb-your-bot-token
export SLACK_USER_TOKEN=xoxp-your-user-token
```

- `SLACK_BOT_TOKEN`: メッセージ取得・スレッド取得・前後の会話取得に使用
- `SLACK_USER_TOKEN`: キーワード検索に使用

### 3. プラグインのインストール

```bash
claude plugin install slack-search-mcp
```

## ツール一覧

### `get_message` — メッセージ取得

Slack メッセージの URL から対象メッセージを取得する。

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| `url` | string | はい | Slack メッセージの URL |

### `get_thread` — スレッド読み込み

指定メッセージのスレッド（返信一覧）を取得する。

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| `url` | string | `channel` + `ts` 未指定時は必須 | Slack メッセージの URL |
| `channel` | string | `url` 未指定時は必須 | チャンネル ID |
| `ts` | string | `url` 未指定時は必須 | 親メッセージの timestamp |

### `get_context` — 前後の会話取得

指定メッセージの前後の会話を取得する。

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| `url` | string | はい | Slack メッセージの URL |
| `count` | number | いいえ | 前後の取得件数 (デフォルト: 5, 最大: 50) |

### `search_messages` — キーワード検索

Slack メッセージをキーワードで検索する。Slack の検索修飾子（`in:#channel`, `from:@user`, `before:`, `after:` など）に対応。

| パラメータ | 型 | 必須 | 説明 |
|---|---|---|---|
| `query` | string | はい | 検索クエリ |
| `count` | number | いいえ | 取得件数 (デフォルト: 20, 最大: 100) |
| `sort` | string | いいえ | `score`（関連度）or `timestamp`（日時）。デフォルト: `score` |
| `sort_dir` | string | いいえ | `asc` or `desc`。デフォルト: `desc` |

## 開発

### 技術スタック

- **ランタイム**: Node.js (>=18)
- **言語**: TypeScript
- **MCP SDK**: `@modelcontextprotocol/sdk`
- **Slack API**: `@slack/web-api`
- **バンドラー**: esbuild

### コマンド

```bash
pnpm install      # 依存パッケージのインストール
pnpm run dev      # tsx で開発モード実行
pnpm run build    # 型チェック + esbuild バンドル (dist/index.mjs)
pnpm test         # テスト実行
```

## ライセンス

MIT
