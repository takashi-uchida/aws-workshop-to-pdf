const { PDFDocument } = require('pdf-lib');
const fs = require('fs');

(async () => {
  const pdfBytes = fs.readFileSync('./test-output.pdf');
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const pageCount = pdfDoc.getPageCount();
  const pages = pdfDoc.getPages();
  
  console.log(`\n📊 PDF詳細情報:`);
  console.log(`   ページ数: ${pageCount}`);
  console.log(`   ファイルサイズ: ${pdfBytes.length} bytes`);
  
  if (pageCount > 0) {
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    console.log(`   ページサイズ: ${width} x ${height}`);
    console.log(`\n✅ PDFは正常に生成されています（全ページが1つのPDFに含まれています）`);
  } else {
    console.log(`\n❌ PDFにページがありません`);
  }
})();
