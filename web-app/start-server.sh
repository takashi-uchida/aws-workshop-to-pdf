#!/bin/bash

# Web to PDF Converter - ローカルサーバー起動スクリプト

echo "🚀 Web to PDF Converter - ローカルサーバーを起動します..."
echo ""
echo "📍 URL: http://localhost:8000"
echo ""
echo "💡 ヒント:"
echo "  - ブラウザで http://localhost:8000 を開いてください"
echo "  - 停止するには Ctrl+C を押してください"
echo ""
echo "----------------------------------------"
echo ""

# Python3でHTTPサーバーを起動
python3 -m http.server 8000
