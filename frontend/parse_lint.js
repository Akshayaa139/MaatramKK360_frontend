
const fs = require('fs');

const content = fs.readFileSync('lint_output.txt', 'utf8');
const lines = content.split('\n');

const fileErrors = {};
let currentFile = '';

lines.forEach(line => {
  if (line.includes('C:\\Users\\Akshayaa')) {
    currentFile = line.trim();
    if (!fileErrors[currentFile]) {
        fileErrors[currentFile] = 0;
    }
  } else if (line.match(/\d+:\d+/)) {
      if (currentFile) {
          fileErrors[currentFile]++;
      }
  }
});

const sortedFiles = Object.entries(fileErrors).sort((a, b) => b[1] - a[1]);

console.log('Files with errors:');
sortedFiles.forEach(([file, count]) => {
    if (count > 0) {
        console.log(`${count} errors: ${file}`);
    }
});
