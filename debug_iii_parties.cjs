const fs = require('fs');
const path = require('path');
const filePath = path.join(process.cwd(), 'public/data/elections/2024-parliamentary.json');
const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
const keys = Object.keys(data.constituencies.III.parties);
console.log('Party IDs in III:', keys);
