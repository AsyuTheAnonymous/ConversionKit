export async function convertPdfToText(file) {
  if (!file) {
    throw new Error('Please select a PDF file.');
  }

  const arrayBuffer = await file.arrayBuffer();
  
  // Load PDF
  const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
  let fullText = '';
  
  // Extract text from each page
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const textContent = await page.getTextContent();
    const pageText = textContent.items.map(item => item.str).join(' ');
    fullText += pageText + '\n\n';
  }
  
  const blob = new Blob([fullText], { type: 'text/plain' });
  const filename = file.name.replace('.pdf', '.txt');
  
  return { blob, filename };
}
