export function hideAllAreas() {
  document.getElementById('progressArea').classList.add('hidden');
  document.getElementById('resultArea').classList.add('hidden');
  document.getElementById('errorArea').classList.add('hidden');
}

export function showProgress() {
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

export function completeProgress() {
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  progressBar.style.width = '100%';
  progressText.textContent = 'Complete!';
  
  setTimeout(() => {
    document.getElementById('progressArea').classList.add('hidden');
    document.getElementById('resultArea').classList.remove('hidden');
  }, 500);
}

export function showError(message) {
  document.getElementById('progressArea').classList.add('hidden');
  document.getElementById('errorMessage').textContent = message;
  document.getElementById('errorArea').classList.add('hidden');
}

export function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function copyToClipboard(elementId) {
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
