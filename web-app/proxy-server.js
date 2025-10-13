const express = require('express');
const cors = require('cors');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// CORS設定
app.use(cors());
app.use(express.json());

// 静的ファイルの提供
app.use(express.static(__dirname));

// プロキシエンドポイント
app.post('/api/fetch-page', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URLが指定されていません' });
    }

    // URLの検証
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({ error: '無効なURLです' });
    }

    // ページを取得
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 30000,
      maxRedirects: 5
    });

    // HTMLを返す
    res.json({
      html: response.data,
      url: response.request.res.responseUrl || url,
      status: response.status
    });

  } catch (error) {
    console.error('Fetch error:', error.message);
    
    if (error.response) {
      res.status(error.response.status).json({
        error: `ページの取得に失敗しました: ${error.response.status}`,
        details: error.message
      });
    } else if (error.code === 'ECONNABORTED') {
      res.status(408).json({
        error: 'タイムアウトしました',
        details: error.message
      });
    } else {
      res.status(500).json({
        error: 'ページの取得に失敗しました',
        details: error.message
      });
    }
  }
});

app.listen(PORT, () => {
  console.log(`Proxy server running on http://localhost:${PORT}`);
});
