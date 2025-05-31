export async function convertTextToPdf() {
  const textInput = document.getElementById('textInput');
  const text = textInput.value.trim();
  
  if (!text) {
    throw new Error('Please enter some text to convert.');
  }

  // Create PDF using PDF-lib
  const pdfDoc = await PDFLib.PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  
  const fontSize = 12;
  const font = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
  
  // Split text into lines that fit on the page
  const maxWidth = 500;
  const lines = [];
  const words = text.split(' ');
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const width = font.widthOfTextAtSize(testLine, fontSize);
    
    if (width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  
  // Add text to PDF
  let yPosition = 750;
  for (const line of lines) {
    if (yPosition < 50) {
      // Add new page if needed
      const newPage = pdfDoc.addPage([595.28, 841.89]);
      yPosition = 750;
      newPage.drawText(line, {
        x: 50,
        y: yPosition,
        size: fontSize,
        font: font,
      });
    } else {
      page.drawText(line, {
        x: 50,
        y: yPosition,
        size: fontSize,
        font: font,
      });
    }
    yPosition -= 20;
  }
  
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const filename = 'converted-text.pdf';
  
  return { blob, filename };
}
