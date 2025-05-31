let currentConversionType = null;
let dailyConversions = 0;

// Try to get from localStorage, but handle if it's not available
try {
  dailyConversions = parseInt(localStorage.getItem('dailyConversions') || '0');
} catch (e) {
  // localStorage not available (sandboxed environment), use session variable
  dailyConversions = window.sessionConversions || 0;
}

// Update counter display
document.getElementById('conversionsToday').textContent = dailyConversions;

function setConversionType(type) {
  currentConversionType = type;
  
  // Update UI based on conversion type
  const fileInput = document.getElementById('fileInput');
  const textInputArea = document.getElementById('textInputArea');
  const convertBtn = document.getElementById('convertBtn');
  
  // Reset areas
  hideAllAreas();
  
  if (type === 'text-to-pdf' || type === 'markdown-to-html' ||
      type === 'csv-to-json' || type === 'json-to-csv' || type === 'xml-to-json' || type === 'html-to-pdf') {
    textInputArea.classList.remove('hidden');
    fileInput.accept = ''; // Clear file input accept for text-based conversions
    convertBtn.disabled = false;
    
    // Update placeholder text based on conversion type
    const textInput = document.getElementById('textInput');
    if (type === 'text-to-pdf') {
      textInput.placeholder = 'Enter your text here...';
    } else if (type === 'markdown-to-html') {
      textInput.placeholder = 'Enter Markdown text here...';
    } else if (type === 'csv-to-json') {
      textInput.placeholder = 'Enter CSV data here...';
    } else if (type === 'json-to-csv') {
      textInput.placeholder = 'Enter JSON data here...';
    } else if (type === 'xml-to-json') {
      textInput.placeholder = 'Enter XML data here...';
    } else if (type === 'html-to-pdf') {
      textInput.placeholder = 'Enter HTML content here...';
    }
  } else {
    textInputArea.classList.add('hidden');
    if (type === 'pdf-to-text') {
      fileInput.accept = '.pdf';
    } else if (type === 'docx-to-html') {
      fileInput.accept = '.docx';
    } else if (type === 'csv-to-json') {
      fileInput.accept = '.csv';
    } else if (type === 'json-to-csv') {
      fileInput.accept = '.json';
    } else if (type === 'html-to-pdf') {
      fileInput.accept = '.html,.htm';
    } else if (type === 'xml-to-json') {
      fileInput.accept = '.xml';
    }
    convertBtn.disabled = true;
  }
  
  // Update button styles
  document.querySelectorAll('.conversion-btn').forEach(btn => {
      btn.classList.remove('ring-2', 'ring-blue-400');
    });
    event.target.closest('.conversion-btn').classList.add('ring-2', 'ring-blue-400');
  }

  function hideAllAreas() {
    document.getElementById('progressArea').classList.add('hidden');
    document.getElementById('resultArea').classList.add('hidden');
    document.getElementById('errorArea').classList.add('hidden');
  }

  function showProgress() {
    document.getElementById('progressArea').classList.remove('hidden');
    let progress = 0;
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress > 90) progress = 90;
      progressBar.style.width = progress + '%';
      progressText.textContent = `Processing... ${Math.round(progress)}%`;
      
      if (progress >= 90) {
        clearInterval(interval);
      }
    }, 200);
    
    return interval;
  }

  function completeProgress() {
    const progressBar = document.getElementById('progressBar');
    const progressText = document.getElementById('progressText');
    progressBar.style.width = '100%';
    progressText.textContent = 'Complete!';
    
    setTimeout(() => {
      document.getElementById('progressArea').classList.add('hidden');
      document.getElementById('resultArea').classList.remove('hidden');
    }, 500);
  }

  function showError(message) {
    document.getElementById('progressArea').classList.add('hidden');
    document.getElementById('errorMessage').textContent = message;
    document.getElementById('errorArea').classList.add('hidden');
  }

  function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

async function convertFile() {
  if (!currentConversionType) {
    showError('Please select a conversion type first.');
    return;
  }

  hideAllAreas();
  const progressInterval = showProgress();

  try {
    const files = document.getElementById('fileInput').files;
    const textInput = document.getElementById('textInput');
    let results = [];

    if (currentConversionType.includes('text-to-') || currentConversionType === 'markdown-to-html') {
      // Handle text-based conversions
      if (!textInput.value.trim()) {
        throw new Error('Please enter some text to convert.');
      }
      let result;
      if (currentConversionType === 'text-to-pdf') {
        result = await convertTextToPdf();
      } else if (currentConversionType === 'markdown-to-html') {
        result = await convertMarkdownToHtml();
      }
      results.push(result);
    } else {
      // Handle file-based conversions (including batch)
      if (files.length === 0) {
        throw new Error('Please select one or more files.');
      }

      for (const file of files) {
        let result;
        if (currentConversionType === 'pdf-to-text') {
          result = await convertPdfToText(file);
        } else if (currentConversionType === 'docx-to-html') {
          result = await convertDocxToHtml(file);
        } else if (currentConversionType === 'csv-to-json') {
          result = await convertCsvToJson(file);
        } else if (currentConversionType === 'json-to-csv') {
          result = await convertJsonToCsv(file);
        } else if (currentConversionType === 'html-to-pdf') {
          result = await convertHtmlToPdf(file);
        } else if (currentConversionType === 'xml-to-json') {
          result = await convertXmlToJson(file);
        }
        results.push(result);
      }
    }

    clearInterval(progressInterval);
    completeProgress();
    
    // Update download section for single or multiple results
    const downloadSection = document.getElementById('downloadSection');
    downloadSection.innerHTML = ''; // Clear previous results

    if (results.length === 1) {
      const result = results[0];
      downloadSection.innerHTML = `
        <button onclick="downloadFile(window.lastConversionResult.blob, '${result.filename}')" 
                class="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300">
          Download ${result.filename}
        </button>
      `;
      window.lastConversionResult = result; // Store for single download
    } else if (results.length > 1) {
      // For multiple files, offer a ZIP download
      const zip = new JSZip();
      for (const res of results) {
        zip.file(res.filename, res.blob);
      }
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadSection.innerHTML = `
        <button onclick="downloadFile(window.lastConversionResult.blob, 'converted_files.zip')" 
                class="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300">
          Download All (${results.length} files) as ZIP
        </button>
      `;
      window.lastConversionResult = { blob: zipBlob, filename: 'converted_files.zip' };
    }
    
    // Update conversion counter
    dailyConversions += results.length;
    try {
      localStorage.setItem('dailyConversions', dailyConversions.toString());
    } catch (e) {
      window.sessionConversions = dailyConversions;
    }
    document.getElementById('conversionsToday').textContent = dailyConversions;
    
  } catch (error) {
    clearInterval(progressInterval);
    showError(error.message);
  }
}

async function convertPdfToText(file) {
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

async function convertDocxToHtml(file) {
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

async function convertTextToPdf() {
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

// File input handler
document.getElementById('fileInput').addEventListener('change', function(e) {
  if (e.target.files[0]) {
    const fileName = e.target.files[0].name;
    const fileNameDisplay = document.getElementById('selectedFileName');
    fileNameDisplay.textContent = `Selected: ${fileName}`;
    fileNameDisplay.classList.remove('hidden');
    document.getElementById('convertBtn').disabled = false;
  }
});

// Text input handler
document.getElementById('textInput').addEventListener('input', function(e) {
  const convertBtn = document.getElementById('convertBtn');
  const textBasedConversions = ['text-to-pdf', 'markdown-to-html'];
  if (textBasedConversions.includes(currentConversionType)) {
    convertBtn.disabled = !e.target.value.trim();
  }
});

// Drag and drop functionality
const uploadArea = document.getElementById('uploadArea');

uploadArea.addEventListener('dragover', function(e) {
  e.preventDefault();
  uploadArea.classList.add('border-blue-400/70', 'bg-blue-900/20');
});

uploadArea.addEventListener('dragleave', function(e) {
  e.preventDefault();
  uploadArea.classList.remove('border-blue-400/70', 'bg-blue-900/20');
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    document.getElementById('fileInput').files = files;
    const fileName = files[0].name;
    const fileNameDisplay = document.getElementById('selectedFileName');
    fileNameDisplay.textContent = `Selected: ${fileName}`;
    fileNameDisplay.classList.remove('hidden');
    if (currentConversionType !== 'text-to-pdf') {
      document.getElementById('convertBtn').disabled = false;
    }
  }
});

// Plain Text Tools functions
function processPlainTextTool() {
  const selector = document.getElementById('plainTextToolSelector');
  const selectedTool = selector.value;
  const textInput = document.getElementById('plainTextInput');
  const textOutput = document.getElementById('plainTextOutput');
  const findInput = document.getElementById('findInput');
  const replaceInput = document.getElementById('replaceInput');

  const text = textInput.value;
  const find = findInput.value;
  const replace = replaceInput.value;

  if (!text.trim() && selectedTool !== 'word-character-count') {
    textOutput.value = 'Please enter text to process.';
    return;
  }

  switch (selectedTool) {
    case 'word-character-count':
      const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
      const charCount = text.length;
      textOutput.value = `Words: ${wordCount}\nCharacters: ${charCount}`;
      break;
    case 'remove-extra-spaces':
      textOutput.value = text.replace(/\s+/g, ' ').trim();
      break;
    case 'capitalize-words':
      textOutput.value = text.toLowerCase().split(' ').map(word => {
        return word.charAt(0).toUpperCase() + word.slice(1);
      }).join(' ');
      break;
    case 'reverse-text':
      textOutput.value = text.split('').reverse().join('');
      break;
    case 'sort-lines':
      textOutput.value = text.split('\n').sort().join('\n');
      break;
    case 'remove-duplicate-lines':
      const lines = text.split('\n');
      const uniqueLines = [...new Set(lines)];
      textOutput.value = uniqueLines.join('\n');
      break;
    case 'find-replace':
      if (!find) {
        textOutput.value = 'Please enter text to find.';
        return;
      }
      textOutput.value = text.replace(new RegExp(find, 'g'), replace);
      break;
    default:
      textOutput.value = 'Please select a valid tool.';
  }
}

// New functions for plain text tools
// (These functions are now integrated directly into processPlainTextTool for efficiency)

// Encoding/Decoding Tools functions

// Encoding/Decoding Tools functions
function urlEncode() {
  const input = document.getElementById('urlEncodeInput').value;
  const output = document.getElementById('urlEncodeOutput');
  output.value = encodeURIComponent(input);
}

function base64Encode() {
  const input = document.getElementById('base64EncodeInput').value;
  const output = document.getElementById('base64EncodeOutput');
  output.value = btoa(input);
}

function copyToClipboard(elementId) {
  const element = document.getElementById(elementId);
  element.select();
  document.execCommand('copy');

  // Provide visual feedback
  const originalText = element.value;
  element.value = 'Copied!';
  setTimeout(() => {
    element.value = originalText;
  }, 1000);
}

// Google Drive Integration
const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // REPLACE WITH YOUR ACTUAL CLIENT ID
const API_KEY = 'YOUR_GOOGLE_API_KEY'; // REPLACE WITH YOUR ACTUAL API KEY IF NEEDED FOR OTHER GOOGLE APIS
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly';

let tokenClient;
let gapiInited = false;
let gisInited = false;
let selectedGoogleDriveFile = null; // To store the selected Google Drive file info

function gapiLoaded() {
  gapi.load('client:picker', initializeGapiClient);
}

async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: DISCOVERY_DOCS,
  });
  gapiInited = true;
  maybeEnableButtons();
}

function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // Will be set in handleAuthClick
  });
  gisInited = true;
  maybeEnableButtons();
}

function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    document.getElementById('authorize_button').style.display = 'block';
  }
}

function handleAuthClick() {
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      throw (resp);
    }
    document.getElementById('authorize_button').textContent = 'Upload from Google Drive';
    createPicker();
  };

  if (gapi.client.getToken() === null) {
    // No token, initiate authorization flow.
    tokenClient.requestAccessToken({ prompt: 'consent' });
  } else {
    // Token exists, refresh it.
    tokenClient.requestAccessToken({ prompt: '' });
  }
}

function createPicker() {
  const view = new google.picker.View(google.picker.ViewId.DOCS);
  view.setMimeTypes('application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/csv,application/json,text/html,application/xml');
  
  const picker = new google.picker.PickerBuilder()
    .enableFeature(google.picker.Feature.NAV_EXPLORER_ENABLED)
    .setAppId(CLIENT_ID.split('.')[0]) // App ID is usually the first part of client ID
    .setOAuthToken(gapi.client.getToken().access_token)
    .addView(view)
    .setCallback(pickerCallback)
    .build();
  picker.setVisible(true);
}

async function pickerCallback(data) {
  if (data[google.picker.Response.ACTION] === google.picker.Action.PICKED) {
    const file = data[google.picker.Response.DOCUMENTS][0];
    selectedGoogleDriveFile = {
      id: file.id,
      name: file.name,
      mimeType: file.mimeType
    };
    
    const fileNameDisplay = document.getElementById('selectedFileName');
    fileNameDisplay.textContent = `Selected from Drive: ${file.name}`;
    fileNameDisplay.classList.remove('hidden');
    document.getElementById('convertBtn').disabled = false;
    
    // Clear local file input if a Drive file is selected
    document.getElementById('fileInput').value = '';
  }
}

async function downloadGoogleDriveFile(fileId, fileName, mimeType) {
  const accessToken = gapi.client.getToken().access_token;
  const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to download file from Google Drive: ${response.statusText}`);
  }

  const blob = await response.blob();
  return new File([blob], fileName, { type: mimeType });
}

// Modify convertFile to handle Google Drive files
const originalConvertFile = convertFile; // Store original for potential reuse or comparison

convertFile = async function() {
  if (selectedGoogleDriveFile) {
    hideAllAreas();
    const progressInterval = showProgress();
    try {
      const file = await downloadGoogleDriveFile(
        selectedGoogleDriveFile.id,
        selectedGoogleDriveFile.name,
        selectedGoogleDriveFile.mimeType
      );

      let result;
      if (currentConversionType === 'pdf-to-text') {
        result = await convertPdfToText(file);
      } else if (currentConversionType === 'docx-to-html') {
        result = await convertDocxToHtml(file);
      } else if (currentConversionType === 'csv-to-json') {
        result = await convertCsvToJson(file);
      } else if (currentConversionType === 'json-to-csv') {
        result = await convertJsonToCsv(file);
      } else if (currentConversionType === 'html-to-pdf') {
        result = await convertHtmlToPdf(file);
      } else if (currentConversionType === 'xml-to-json') {
        result = await convertXmlToJson(file);
      } else {
        throw new Error('Unsupported conversion type for Google Drive file.');
      }

      clearInterval(progressInterval);
      completeProgress();

      const downloadSection = document.getElementById('downloadSection');
      downloadSection.innerHTML = '';
      downloadSection.innerHTML = `
        <button onclick="downloadFile(window.lastConversionResult.blob, '${result.filename}')" 
                class="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300">
          Download ${result.filename}
        </button>
      `;
      window.lastConversionResult = result;

      dailyConversions++;
      try {
        localStorage.setItem('dailyConversions', dailyConversions.toString());
      } catch (e) {
        window.sessionConversions = dailyConversions;
      }
      document.getElementById('conversionsToday').textContent = dailyConversions;

      selectedGoogleDriveFile = null; // Reset after conversion
      document.getElementById('selectedFileName').classList.add('hidden');
      document.getElementById('convertBtn').disabled = true;

    } catch (error) {
      clearInterval(progressInterval);
      showError(error.message);
    }
  } else {
    // If no Google Drive file is selected, use the original convertFile logic
    originalConvertFile();
  }
};

// Override file input change listener to clear Google Drive selection
document.getElementById('fileInput').removeEventListener('change', function(e) {
  if (e.target.files[0]) {
    const fileName = e.target.files[0].name;
    const fileNameDisplay = document.getElementById('selectedFileName');
    fileNameDisplay.textContent = `Selected: ${fileName}`;
    fileNameDisplay.classList.remove('hidden');
    document.getElementById('convertBtn').disabled = false;
  }
});

document.getElementById('fileInput').addEventListener('change', function(e) {
  selectedGoogleDriveFile = null; // Clear Google Drive selection
  if (e.target.files[0]) {
    const fileName = e.target.files[0].name;
    const fileNameDisplay = document.getElementById('selectedFileName');
    fileNameDisplay.textContent = `Selected: ${fileName}`;
    fileNameDisplay.classList.remove('hidden');
    document.getElementById('convertBtn').disabled = false;
  } else {
    document.getElementById('selectedFileName').classList.add('hidden');
    document.getElementById('convertBtn').disabled = true;
  }
});

// Override drag and drop functionality to clear Google Drive selection
uploadArea.removeEventListener('dragleave', function(e) {
  e.preventDefault();
  uploadArea.classList.remove('border-blue-400/70', 'bg-blue-900/20');
  
  const files = e.dataTransfer.files;
  if (files.length > 0) {
    document.getElementById('fileInput').files = files;
    const fileName = files[0].name;
    const fileNameDisplay = document.getElementById('selectedFileName');
    fileNameDisplay.textContent = `Selected: ${fileName}`;
    fileNameDisplay.classList.remove('hidden');
    if (currentConversionType !== 'text-to-pdf') {
      document.getElementById('convertBtn').disabled = false;
    }
  }
});

uploadArea.addEventListener('drop', function(e) {
  e.preventDefault();
  uploadArea.classList.remove('border-blue-400/70', 'bg-blue-900/20');
  selectedGoogleDriveFile = null; // Clear Google Drive selection

  const files = e.dataTransfer.files;
  if (files.length > 0) {
    document.getElementById('fileInput').files = files;
    const fileName = files[0].name;
    const fileNameDisplay = document.getElementById('selectedFileName');
    fileNameDisplay.textContent = `Selected: ${fileName}`;
    fileNameDisplay.classList.remove('hidden');
    if (currentConversionType !== 'text-to-pdf') {
      document.getElementById('convertBtn').disabled = false;
    }
  }
});
