export function processPlainTextTool() {
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
