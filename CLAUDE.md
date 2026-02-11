# CLAUDE.md

このファイルは Claude Code がこのリポジトリで作業する際のガイドラインです。

## プロジェクト概要

Slack メッセージの取得・スレッド読み込みを行う MCP サーバー。
Node.js + TypeScript で実装し、MCP プロトコル経由でツールを公開する。

## ディレクトリ構成

```
slack-search-mcp/
├── src/
│   ├── index.ts          # エントリポイント（MCP サーバー起動）
│   ├── tools/            # MCP ツール定義
│   │   ├── get-message.ts
│   │   └── get-thread.ts
│   ├── slack/            # Slack API クライアント
│   │   └── client.ts
│   └── utils/
│       └── url-parser.ts # Slack URL パース処理
├── package.json
├── tsconfig.json
└── README.md
```

## コマンド

- `pnpm install` — 依存パッケージのインストール
- `pnpm run build` — TypeScript コンパイル (`dist/` に出力)
- `pnpm run dev` — 開発モード実行 (ts-node)
- `pnpm run lint` — ESLint によるリント
- `pnpm test` — テスト実行

## コーディング規約

- TypeScript strict モード有効
- ESM (ES Modules) を使用
- エラーは適切な MCP エラーレスポンスとして返す（プロセスを落とさない）
- Slack API トークンは環境変数 `SLACK_BOT_TOKEN` から取得
- ハードコードされたトークンやワークスペース名を含めないこと

## 主要な設計判断

### Slack URL パース
- URL 形式: `https://<workspace>.slack.com/archives/<channel_id>/p<timestamp>`
- timestamp 変換: URL 中の `p1234567890123456` → API 用 `1234567890.123456`（末尾6桁の前にドット挿入）
- 正規表現でパースし、不正な URL にはエラーメッセージを返す

### MCP ツール設計
- `get_message`: URL を受け取り、単一メッセージを返す
- `get_thread`: URL またはチャンネル ID + timestamp を受け取り、スレッド全体を返す
- 入力バリデーションには zod を使用

### 依存パッケージ
- `@modelcontextprotocol/sdk` — MCP サーバー実装
- `@slack/web-api` — Slack API クライアント
- `zod` — 入力バリデーション
- `typescript` — 開発用

## 注意事項

- Bot トークンは `xoxb-` で始まるものを使用
- Bot がチャンネルに参加していないとメッセージ取得に失敗する（`not_in_channel` エラー）
- Slack API のレートリミットに注意（Tier 3: ~50 req/min）
