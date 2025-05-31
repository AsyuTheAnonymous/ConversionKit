export function urlEncode() {
  const input = document.getElementById('urlEncodeInput').value;
  const output = document.getElementById('urlEncodeOutput');
  output.value = encodeURIComponent(input);
}

export function base64Encode() {
  const input = document.getElementById('base64EncodeInput').value;
  const output = document.getElementById('base64EncodeOutput');
  output.value = btoa(input);
}
