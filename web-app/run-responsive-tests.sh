#!/bin/bash

# レスポンシブデザインテストの実行スクリプト

echo "🚀 レスポンシブデザインテストを開始します..."
echo ""

# カラー定義
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ローカルサーバーの起動確認
echo -e "${BLUE}📡 ローカルサーバーの確認...${NC}"
if command -v python3 &> /dev/null; then
    echo "✅ Python3が利用可能です"
    SERVER_CMD="python3 -m http.server 8000"
elif command -v python &> /dev/null; then
    echo "✅ Pythonが利用可能です"
    SERVER_CMD="python -m http.server 8000"
elif command -v npx &> /dev/null; then
    echo "✅ npxが利用可能です"
    SERVER_CMD="npx serve -p 8000"
else
    echo "❌ ローカルサーバーを起動できません"
    echo "   Python3またはNode.jsをインストールしてください"
    exit 1
fi

echo ""
echo -e "${BLUE}📋 テスト手順:${NC}"
echo ""
echo "1. ローカルサーバーを起動します"
echo "2. ブラウザでテストページを開きます"
echo "3. 各ビューポートサイズでテストを実行します"
echo "4. チェックリストを確認します"
echo "5. テスト結果をエクスポートします"
echo ""

# ユーザーに確認
read -p "続行しますか? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "テストをキャンセルしました"
    exit 0
fi

echo ""
echo -e "${GREEN}🌐 ローカルサーバーを起動しています...${NC}"
echo ""
echo "サーバーコマンド: $SERVER_CMD"
echo ""
echo -e "${YELLOW}⚠️  サーバーを停止するには Ctrl+C を押してください${NC}"
echo ""
echo "テストページURL:"
echo "  http://localhost:8000/test-responsive-design.html"
echo ""
echo "メインアプリURL:"
echo "  http://localhost:8000/index.html"
echo ""

# ブラウザを開く (OSに応じて)
sleep 2
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open "http://localhost:8000/test-responsive-design.html"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    xdg-open "http://localhost:8000/test-responsive-design.html" 2>/dev/null || echo "ブラウザを手動で開いてください"
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows
    start "http://localhost:8000/test-responsive-design.html"
fi

# サーバーを起動
$SERVER_CMD
