export async function convertDocxToHtml(file) {
  if (!file) {
    throw new Error('Please select a DOCX file.');
  }

  const arrayBuffer = await file.arrayBuffer();
  
  // Convert DOCX to HTML using mammoth
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Converted Document</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
      </style>
    </head>
    <body>
      ${result.value}
    </body>
    </html>
  `;
  
  const blob = new Blob([html], { type: 'text/html' });
  const filename = file.name.replace('.docx', '.html');
  
  return { blob, filename };
}
