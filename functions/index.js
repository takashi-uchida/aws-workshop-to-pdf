const {onRequest} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const puppeteer = require("puppeteer-core");
const chromium = require("@sparticuz/chromium");
const {v4: uuidv4} = require("uuid");
const {PDFDocument} = require("pdf-lib");

admin.initializeApp();

/**
 * PDF変換Function
 * HTTPSトリガーでWebページをPDFに変換
 */
exports.convertToPdf = onRequest(
    {
      timeoutSeconds: 300,
      memory: "2GiB",
      maxInstances: 10,
    },
    async (req, res) => {
      // CORS設定
      res.set("Access-Control-Allow-Origin", "*");

      if (req.method === "OPTIONS") {
        res.set("Access-Control-Allow-Methods", "POST");
        res.set("Access-Control-Allow-Headers", "Content-Type");
        res.status(204).send("");
        return;
      }

      if (req.method !== "POST") {
        res.status(405).json({error: "POSTメソッドのみ許可されています"});
        return;
      }

      try {
        // リクエスト検証
        const {url, settings = {}} = req.body;

        if (!url) {
          res.status(400).json({error: "URLが必要です"});
          return;
        }

        // URL形式の検証
        try {
          new URL(url);
        } catch (error) {
          res.status(400).json({error: "無効なURL形式です"});
          return;
        }

        console.log(`PDF変換開始: ${url}`);

        // ストリーミングレスポンスのヘッダー設定
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");

        // 進捗コールバック
        const onProgress = (progress) => {
          try {
            res.write(`data: ${JSON.stringify(progress)}\n\n`);
          } catch (error) {
            console.error('進捗送信エラー:', error);
          }
        };

        // keep-aliveハートビート
        const heartbeatInterval = setInterval(() => {
          try {
            res.write(': heartbeat\n\n');
          } catch (error) {
            clearInterval(heartbeatInterval);
          }
        }, 15000);

        // PDF生成
        let pdfBuffer;
        try {
          pdfBuffer = await generatePdf(url, settings, onProgress);
        } finally {
          clearInterval(heartbeatInterval);
        }

        // Firebase Storageにアップロード
        onProgress({step: "uploading", percent: 95, message: "アップロード中..."});
        const fileName = `${uuidv4()}.pdf`;
        const downloadUrl = await uploadToStorage(pdfBuffer, fileName);

        console.log(`PDF変換完了: ${fileName}`);

        // 完了レスポンス
        res.write(`data: ${JSON.stringify({
          step: "complete",
          success: true,
          downloadUrl,
          fileName,
        })}\n\n`);
        res.end();
      } catch (error) {
        console.error("PDF変換エラー:", error);
        res.status(500).json({
          error: "PDF変換に失敗しました",
          details: error.message,
        });
      }
    });

/**
 * PuppeteerでPDFを生成
 * @param {string} url - 変換するURL
 * @param {object} settings - PDF設定
 * @param {Function} onProgress - 進捗コールバック
 * @return {Buffer} PDFバッファ
 */
async function generatePdf(url, settings = {}, onProgress = () => {}) {
  let browser = null;

  try {
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setViewport({width: 1280, height: 720});

    onProgress({step: "analyzing", percent: 10, message: "ページを解析中..."});

    // 全ページのリンクを取得
    const links = await getAllWorkshopLinks(page, url);
    const maxPages = 50;
    const pagesToConvert = links.slice(0, maxPages);
    console.log(`Found ${links.length} pages, converting ${pagesToConvert.length}`);

    const pdfBuffers = [];

    // 各ページをPDF化
    for (let i = 0; i < pagesToConvert.length; i++) {
      const link = pagesToConvert[i];
      const percent = 10 + ((i + 1) / pagesToConvert.length) * 70;
      onProgress({
        step: "converting",
        current: i + 1,
        total: pagesToConvert.length,
        percent: Math.round(percent),
        message: `ページ ${i + 1}/${pagesToConvert.length} を変換中...`,
      });
      await page.goto(link.url, {
        waitUntil: "networkidle0",
        timeout: 30000,
      });

      await page.waitForTimeout(3000);

      await page.evaluate(() => {
        return new Promise((resolve) => {
          let totalHeight = 0;
          const distance = 100;
          const timer = setInterval(() => {
            const scrollHeight = document.body.scrollHeight;
            window.scrollBy(0, distance);
            totalHeight += distance;

            if (totalHeight >= scrollHeight) {
              clearInterval(timer);
              window.scrollTo(0, 0);
              resolve();
            }
          }, 100);
        });
      });

      await page.waitForTimeout(2000);

      const pdfBuffer = await page.pdf({
        format: settings.pageSize || "A3",
        printBackground: settings.printBackground !== false,
        margin: settings.margins || {
          top: "20px",
          right: "20px",
          bottom: "20px",
          left: "20px",
        },
      });

      pdfBuffers.push(pdfBuffer);
    }

    onProgress({step: "merging", percent: 85, message: "PDFを結合中..."});

    // PDFをマージ
    const mergedPdf = await mergePdfs(pdfBuffers);
    return mergedPdf;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * ワークショップの全ページリンクを取得
 * @param {object} page - Puppeteerページ
 * @param {string} url - ベースURL
 * @return {Array} ページリンクの配列
 */
async function getAllWorkshopLinks(page, url) {
  await page.goto(url, {waitUntil: "networkidle0", timeout: 30000});
  await page.waitForTimeout(5000);
  
  // スクロールして動的コンテンツを読み込み
  await page.evaluate(() => {
    return new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;
        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          window.scrollTo(0, 0);
          resolve();
        }
      }, 50);
    });
  });
  
  await page.waitForTimeout(2000);

  const links = await page.evaluate((baseUrl) => {
    const navLinks = [];
    const seen = new Set();
    const baseUrlObj = new URL(baseUrl);
    const workshopPath = baseUrlObj.pathname.split('/').slice(0, 4).join('/');
    
    const navSelectors = [
      'nav a[href]',
      '.navigation a[href]',
      '[role="navigation"] a[href]',
      '.sidebar a[href]',
      '.menu a[href]',
      'a[href*="/ja-JP"]',
      'a[href*="/en-US"]'
    ];
    
    for (const selector of navSelectors) {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        const href = el.getAttribute("href");
        if (!href) return;
        
        const text = el.textContent.trim();
        let fullUrl;
        
        if (href.startsWith("http")) {
          fullUrl = href;
        } else if (href.startsWith("/")) {
          fullUrl = new URL(href, window.location.origin).href;
        } else {
          fullUrl = new URL(href, baseUrl).href;
        }
        
        const urlObj = new URL(fullUrl);
        const cleanUrl = urlObj.origin + urlObj.pathname;
        
        if (fullUrl && text && !seen.has(cleanUrl) &&
            urlObj.pathname.startsWith(workshopPath)) {
          seen.add(cleanUrl);
          navLinks.push({url: fullUrl, title: text});
        }
      });
    }

    return navLinks;
  }, url);

  console.log(`Found ${links.length} workshop pages`);
  return links.length > 0 ? links : [{url, title: "Main Page"}];
}

/**
 * 複数のPDFをマージ
 * @param {Array} pdfBuffers - PDFバッファの配列
 * @return {Buffer} マージされたPDFバッファ
 */
async function mergePdfs(pdfBuffers) {
  const mergedPdf = await PDFDocument.create();

  for (const pdfBuffer of pdfBuffers) {
    const pdf = await PDFDocument.load(pdfBuffer);
    const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());

    pages.forEach((page) => {
      mergedPdf.addPage(page);
    });
  }

  const mergedPdfBytes = await mergedPdf.save();
  return Buffer.from(mergedPdfBytes);
}

/**
 * Firebase StorageにPDFをアップロード
 * @param {Buffer} pdfBuffer - PDFバッファ
 * @param {string} fileName - ファイル名
 * @return {string} ダウンロードURL
 */
async function uploadToStorage(pdfBuffer, fileName) {
  const bucket = admin.storage().bucket();
  const file = bucket.file(`pdfs/${fileName}`);

  // PDFをアップロード
  await file.save(pdfBuffer, {
    metadata: {
      contentType: "application/pdf",
    },
    public: true,
  });

  // 公開URL
  const downloadUrl = `https://storage.googleapis.com/${bucket.name}/pdfs/${fileName}`;

  return downloadUrl;
}
