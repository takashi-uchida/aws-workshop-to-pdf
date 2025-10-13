const { chromium } = require('playwright');
const fs = require('fs').promises;
const path = require('path');

const WORKSHOP_URL = 'https://catalog.workshops.aws/saas-operations/en-US';
const OUTPUT_DIR = './output';
const TEMP_DIR = './temp';

async function getAllWorkshopLinks(page) {
  await page.goto(WORKSHOP_URL);
  await page.waitForLoadState('networkidle');
  
  const links = await page.evaluate(() => {
    const navLinks = [];
    const navElements = document.querySelectorAll('nav a[href]');
    
    navElements.forEach(element => {
      const href = element.getAttribute('href');
      const text = element.textContent.trim();
      
      if (href && text && !href.startsWith('#') && !href.startsWith('javascript:')) {
        const absoluteUrl = href.startsWith('http') 
          ? href 
          : new URL(href, window.location.origin).href;
        
        if (absoluteUrl.includes('catalog.workshops.aws')) {
          navLinks.push({
            url: absoluteUrl,
            title: text.replace(/[^\w\s]/gi, '').replace(/\s+/g, '_')
          });
        }
      }
    });
    
    return navLinks;
  });
  
  return links;
}

async function convertPageToPdf(page, url, filename) {
  console.log(`Converting: ${url}`);
  
  await page.goto(url, { waitUntil: 'networkidle' });
  
  // Wait for content to load
  await page.waitForTimeout(3000);
  
  // Scroll to load lazy content
  await page.evaluate(() => {
    return new Promise(resolve => {
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
  
  await page.pdf({
    path: filename,
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20px',
      right: '20px',
      bottom: '20px',
      left: '20px'
    },
    displayHeaderFooter: true,
    headerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;">AWS Workshop</div>',
    footerTemplate: '<div style="font-size: 10px; text-align: center; width: 100%;"><span class="pageNumber"></span> / <span class="totalPages"></span></div>'
  });
  
  console.log(`Saved: ${filename}`);
}

async function mergePdfs(pdfPaths, outputPath) {
  try {
    const { PDFDocument } = require('pdf-lib');
    
    const mergedPdf = await PDFDocument.create();
    
    for (const pdfPath of pdfPaths) {
      const pdfBytes = await fs.readFile(pdfPath);
      const pdf = await PDFDocument.load(pdfBytes);
      const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      
      pages.forEach((page) => {
        mergedPdf.addPage(page);
      });
    }
    
    const mergedPdfBytes = await mergedPdf.save();
    await fs.writeFile(outputPath, mergedPdfBytes);
    
    console.log(`Merged PDF saved: ${outputPath}`);
    return true;
  } catch (error) {
    console.log('pdf-lib not installed. Skipping merge. Individual PDFs are available in temp directory.');
    console.log('To enable merging, run: npm install pdf-lib');
    return false;
  }
}

async function cleanupTempFiles(tempFiles) {
  for (const file of tempFiles) {
    try {
      await fs.unlink(file);
    } catch (error) {
      console.error(`Failed to delete temp file: ${file}`);
    }
  }
}

async function main() {
  const browser = await chromium.launch({
    headless: true
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 }
  });
  
  const page = await context.newPage();
  
  try {
    // Create directories
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.mkdir(TEMP_DIR, { recursive: true });
    
    console.log('Fetching workshop navigation links...');
    const links = await getAllWorkshopLinks(page);
    
    if (links.length === 0) {
      console.log('No workshop links found. Converting main page only...');
      links.push({
        url: WORKSHOP_URL,
        title: 'main_page'
      });
    }
    
    console.log(`Found ${links.length} pages to convert`);
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
    const tempPdfs = [];
    
    // Convert each page
    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const filename = path.join(TEMP_DIR, `${i.toString().padStart(3, '0')}_${link.title}.pdf`);
      
      try {
        await convertPageToPdf(page, link.url, filename);
        tempPdfs.push(filename);
      } catch (error) {
        console.error(`Failed to convert ${link.url}: ${error.message}`);
      }
      
      // Delay between requests
      if (i < links.length - 1) {
        await page.waitForTimeout(1000);
      }
    }
    
    // Merge PDFs if possible
    if (tempPdfs.length > 0) {
      const mergedPath = path.join(OUTPUT_DIR, `aws_workshop_complete_${timestamp}.pdf`);
      const merged = await mergePdfs(tempPdfs, mergedPath);
      
      if (merged) {
        await cleanupTempFiles(tempPdfs);
        console.log('Temporary files cleaned up');
      } else {
        // Copy individual PDFs to output
        for (const pdfPath of tempPdfs) {
          const filename = path.basename(pdfPath);
          const outputPath = path.join(OUTPUT_DIR, filename);
          await fs.copyFile(pdfPath, outputPath);
        }
        await cleanupTempFiles(tempPdfs);
        console.log(`Individual PDFs saved in ${OUTPUT_DIR}`);
      }
    }
    
    console.log('Conversion complete!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);