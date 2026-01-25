# 気圧通知

気圧の変化による体調不良を防ぐための  
**気圧可視化・体調アラートWebアプリ**です。

Webアプリでありながら **PWA（Progressive Web App）** に対応しており、  
スマートフォンではアプリのようにインストールして利用できます。

---

## 主な機能

- 現在・昨日の気圧取得（外部API）
- 昨日比から体調レベルを判定（SAFE / WARNING / DANGER）
- 過去7日分の気圧推移をグラフ表示
- 地域切り替え対応
- 気圧変化に応じた警告メッセージ表示
- 通知機能（Notification API）
- API失敗時のフォールバック表示
- 30分ごとの自動更新
- ユーザー設定（判定閾値・更新間隔）
- **PWA対応（ホーム画面追加・アプリ通知）**

---

##  技術スタック

### バックエンド
- Java
- Spring Boot
- Spring MVC

### フロントエンド
- HTML / CSS
- JavaScript（Fetch API）
- Chart.js（グラフ表示）

### 外部API
- Open-Meteo API  
  ※ APIキー不要・無料で利用可能

---

## PWA（Progressive Web App）対応

PressureCare は PWA に対応しており、  
スマートフォンでは **ネイティブアプリのように利用可能**です。

### PWAでできること
- ホーム画面に追加
- アプリ単体で起動
- Service Worker 経由の通知表示
- WebViewではない独立表示（standalone）

---

## PWA関連ファイル構成

src/main/resources/static/
├─ manifest.json
├─ sw.js
├─ icon-192.png
├─ icon-512.png
├─ favicon.ico
├─ css/
└─ js/

---

## アイコン・faviconについて

### PWAアイコン
- `icon-192.png`
- `icon-512.png`

manifest.json にて以下のように指定しています。

```json
"icons": [
  {
    "src": "/icon-192.png",
    "sizes": "192x192",
    "type": "image/png"
  },
  {
    "src": "/icon-512.png",
    "sizes": "512x512",
    "type": "image/png"
  }
]
```
favicon
favicon.ico を static 直下に配置

ブラウザが自動で /favicon.ico を参照

html

<link rel="icon" href="/favicon.ico">

通知機能について
通知は DANGER 判定時に表示

PWAインストール後は Service Worker 経由で通知

初回のみ通知許可を要求

js
registration.showNotification('PressureCare 警戒', {
  body: '気圧変化が大きいため、体調に注意してください'
});

⚙ 設定機能
モーダル形式の設定画面から以下を変更可能です。

注意判定の閾値

警戒判定の閾値

データ更新間隔（分）

設定内容は localStorage に保存され、
ページ再読み込み後も保持されます。

工夫した点
判定ロジックと表示処理の分離

UI変更に強い JavaScript 実装

API失敗時のフォールバック対応

結論ファーストなUI設計（今日の状態を最優先表示）

UXを邪魔しないアニメーション設計

今後の改善案
バックグラウンドPush通知

体調ログ記録機能

気圧と体調の相関分析

ダークモード対応

 起動方法
ブラウザで以下にアクセス
http://localhost:8080/pressure
