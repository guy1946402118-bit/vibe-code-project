const fs = require('fs');
const content = fs.readFileSync('D:\\GrowthDashboard\\src\\pages\\CmsPage.tsx', 'utf8');
const lines = content.split('\n');
console.log('Total lines:', lines.length);
console.log('Last 10 chars:', JSON.stringify(content.slice(-10)));
