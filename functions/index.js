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

        // PDF生成
        const pdfBuffer = await generatePdf(url, settings);

        // Firebase Storageにアップロード
        const fileName = `${uuidv4()}.pdf`;
        const downloadUrl = await uploadToStorage(pdfBuffer, fileName);

        console.log(`PDF変換完了: ${fileName}`);

        // レスポンス
        res.status(200).json({
          success: true,
          downloadUrl,
          fileName,
        });
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
 * @return {Buffer} PDFバッファ
 */
async function generatePdf(url, settings = {}) {
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

    // 全ページのリンクを取得
    const links = await getAllWorkshopLinks(page, url);
    const maxPages = 10;
    const pagesToConvert = links.slice(0, maxPages);
    console.log(`Found ${links.length} pages, converting ${pagesToConvert.length}`);

    const pdfBuffers = [];

    // 各ページをPDF化
    for (const link of pagesToConvert) {
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
        format: "A3",
        landscape: true,
        printBackground: settings.printBackground !== false,
        margin: {
          top: "10px",
          right: "10px",
          bottom: "10px",
          left: "10px",
        },
      });

      pdfBuffers.push(pdfBuffer);
    }

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

  const links = await page.evaluate(() => {
    const navLinks = [];
    const seen = new Set();
    const allLinks = document.querySelectorAll("a[href]");

    allLinks.forEach((el) => {
      const href = el.getAttribute("href");
      if (!href || !href.includes("/en-US")) return;

      const text = el.textContent.trim();
      const fullUrl = href.startsWith("http") ? href : 
        new URL(href, window.location.origin).href;

      if (fullUrl && text && !seen.has(fullUrl) &&
          !fullUrl.includes("#")) {
        seen.add(fullUrl);
        navLinks.push({url: fullUrl, title: text});
      }
    });

    return navLinks;
  });

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
