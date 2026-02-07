const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\15802\\.claude-config-manager-projects.json';
const content = fs.readFileSync(filePath, 'utf-8');
const projects = JSON.parse(content);

console.log('Raw file content (first 3 lines):');
content.split('\n').slice(0, 3).forEach(line => console.log('  ', line));

console.log('\nParsed projects containing my-ai-desktop:');
projects.filter(p => p.includes('my-ai-desktop')).forEach(p => {
  console.log('  -', JSON.stringify(p));
  console.log('    normalized:', path.normalize(p));
});
