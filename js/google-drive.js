import { showError } from './utils.js';

export const CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID'; // REPLACE WITH YOUR ACTUAL CLIENT ID
export const API_KEY = 'YOUR_GOOGLE_API_KEY'; // REPLACE WITH YOUR ACTUAL API KEY IF NEEDED FOR OTHER GOOGLE APIS
export const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
export const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly';

export let tokenClient;
export let gapiInited = false;
export let gisInited = false;
export let selectedGoogleDriveFile = null; // To store the selected Google Drive file info

export function gapiLoaded() {
  gapi.load('client:picker', initializeGapiClient);
}

export async function initializeGapiClient() {
  await gapi.client.init({
    apiKey: API_KEY,
    discoveryDocs: DISCOVERY_DOCS,
  });
  gapiInited = true;
  maybeEnableButtons();
}

export function gisLoaded() {
  tokenClient = google.accounts.oauth2.initTokenClient({
    client_id: CLIENT_ID,
    scope: SCOPES,
    callback: '', // Will be set in handleAuthClick
  });
  gisInited = true;
  maybeEnableButtons();
}

export function maybeEnableButtons() {
  if (gapiInited && gisInited) {
    document.getElementById('authorize_button').style.display = 'block';
  }
}

export function handleAuthClick() {
  tokenClient.callback = async (resp) => {
    if (resp.error !== undefined) {
      showError(resp.error.message); // Use showError from utils
      return;
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

export function createPicker() {
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

export async function pickerCallback(data) {
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

export async function downloadGoogleDriveFile(fileId, fileName, mimeType) {
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
