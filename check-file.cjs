const fs = require('fs');
const content = fs.readFileSync('D:\\GrowthDashboard\\src\\pages\\CmsPage.tsx', 'utf8');
const match = content.match(/AnimatePresence/g);
console.log('AnimatePresence count:', match ? match.length : 0);
