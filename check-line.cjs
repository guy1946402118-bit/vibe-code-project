const fs = require('fs');
const content = fs.readFileSync('D:\\GrowthDashboard\\src\\pages\\CmsPage.tsx', 'utf8');

// Check for common issues
const lines = content.split('\n');
console.log('Total lines:', lines.length);

// Find any line that's too long (>500 chars)
let issueLine = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].length > 500) {
    issueLine = i + 1;
    console.log('Line', issueLine, 'length:', lines[i].length);
  }
}

if (issueLine === -1) {
  console.log('No extremely long lines found');
}

// Check last few lines
console.log('\nLast 5 lines:');
for (let i = Math.max(0, lines.length - 5); i < lines.length; i++) {
  console.log(`Line ${i+1}:`, lines[i].substring(0, 50));
}
