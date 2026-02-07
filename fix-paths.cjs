const fs = require('fs');
const path = require('path');

const filePath = 'C:\\Users\\15802\\.claude-config-manager-projects.json';
const content = fs.readFileSync(filePath, 'utf8');
const projects = JSON.parse(content);

console.log('Before fix:');
console.log('Total projects:', projects.length);
projects.forEach((p, i) => {
  const hasTripleBackslash = p.includes('\\\\\\');
  if (hasTripleBackslash || p.includes('my-ai-desktop')) {
    console.log(`  ${i + 1}. ${hasTripleBackslash ? 'BAD ' : 'OK  '} ${JSON.stringify(p)}`);
  }
});

// Normalize and deduplicate
const normalized = projects.map(p => path.normalize(p));
const unique = [...new Set(normalized)];

console.log('\nAfter fix:');
console.log('Total projects:', unique.length);
unique.forEach((p, i) => {
  const isMyAiDesktop = p.includes('my-ai-desktop');
  if (isMyAiDesktop) {
    console.log(`  ${i + 1}. ${JSON.stringify(p)}`);
  }
});

// Write back
fs.writeFileSync(filePath, JSON.stringify(unique, null, 2));
console.log('\nFile updated successfully!');
