import { hideAllAreas, showProgress, completeProgress, showError, downloadFile, copyToClipboard } from './utils.js';
import { processPlainTextTool } from './plain-text-tools.js';
import { urlEncode, base64Encode } from './encoding-decoding.js';
import { 
  gapiLoaded, gisLoaded, handleAuthClick, selectedGoogleDriveFile, downloadGoogleDriveFile,
  CLIENT_ID, API_KEY, DISCOVERY_DOCS, SCOPES, tokenClient, gapiInited, gisInited, maybeEnableButtons
} from './google-drive.js';

import { convertPdfToText } from './converters/pdf-to-text.js';
import { convertDocxToHtml } from './converters/docx-to-html.js';
import { convertTextToPdf } from './converters/text-to-pdf.js';
import { convertCsvToJson } from './converters/csv-to-json.js';
import { convertJsonToCsv } from './converters/json-to-csv.js';
import { convertHtmlToPdf } from './converters/html-to-pdf.js';
import { convertMarkdownToHtml } from './converters/markdown-to-html.js';
import { convertXmlToJson } from './converters/xml-to-json.js';

let currentConversionType = null;
let dailyConversions = 0;

// Expose functions to the global scope for onclick attributes in index.html
window.setConversionType = setConversionType;
window.convertFile = convertFile;
window.processPlainTextTool = processPlainTextTool;
window.urlEncode = urlEncode;
window.base64Encode = base64Encode;
window.copyToClipboard = copyToClipboard;
window.gapiLoaded = gapiLoaded;
window.gisLoaded = gisLoaded;
window.handleAuthClick = handleAuthClick;


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

async function convertFile() {
  if (!currentConversionType) {
    showError('Please select a conversion type first.');
    return;
  }

  hideAllAreas();
  const progressInterval = showProgress();

  try {
    let filesToProcess = [];

    if (selectedGoogleDriveFile) {
      const file = await downloadGoogleDriveFile(
        selectedGoogleDriveFile.id,
        selectedGoogleDriveFile.name,
        selectedGoogleDriveFile.mimeType
      );
      filesToProcess.push(file);
      selectedGoogleDriveFile = null; // Reset after processing
      document.getElementById('selectedFileName').classList.add('hidden');
      document.getElementById('convertBtn').disabled = true;
    } else {
      const localFiles = document.getElementById('fileInput').files;
      if (localFiles.length > 0) {
        filesToProcess = Array.from(localFiles);
      }
    }

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
      if (filesToProcess.length === 0) {
        throw new Error('Please select one or more files.');
      }

      for (const file of filesToProcess) {
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

// File input handler
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

uploadArea.addEventListener('dragleave', function(e) {
  e.preventDefault();
  uploadArea.classList.remove('border-blue-400/70', 'bg-blue-900/20');
});
