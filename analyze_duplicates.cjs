const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'public/data/elections/2024-parliamentary.json');

try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const results = data.results;

    // Map names to list of {id, constituency}
    const nameMap = {};

    Object.entries(results).forEach(([id, info]) => {
        const name = info.name;
        if (!nameMap[name]) {
            nameMap[name] = [];
        }
        nameMap[name].push({ id, constituency: info.constituency });
    });

    console.log('Duplicate Municipality Names in Different Constituencies:');
    console.log('-------------------------------------------------------');

    let found = false;
    Object.entries(nameMap).forEach(([name, locations]) => {
        if (locations.length > 1) {
            // Check if they are in different constituencies
            const constituencies = new Set(locations.map(l => l.constituency));
            if (constituencies.size > 1) {
                found = true;
                console.log(`\nName: ${name}`);
                locations.forEach(loc => {
                    console.log(`  - ID: ${loc.id}, Constituency: ${loc.constituency}`);
                });
            }
        }
    });

    if (!found) {
        console.log('No duplicates found across different constituencies.');
    }

} catch (err) {
    console.error(err);
}
