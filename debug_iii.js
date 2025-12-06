const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'public/data/elections/2024-parliamentary.json');

try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!data.constituencies) {
        console.log('No constituencies field found in JSON!');
        // Iterate results and sum up for III. IZBORNA JEDINICA to see what's happening
        // But App.tsx relies on data.constituencies existence.

        // Let's check keys of results to see if there's any hint
        console.log('Keys in data:', Object.keys(data));
        process.exit(1);
    }

    // Check keys in constituencies
    console.log('Constituency keys:', Object.keys(data.constituencies));

    const targetKey = Object.keys(data.constituencies).find(k => k.includes('III') || k === '3');
    console.log('Found key for III:', targetKey);

    if (targetKey) {
        const cData = data.constituencies[targetKey];
        console.log('Data for', targetKey);
        console.log('Total valid votes (from party sum):', Object.values(cData.parties).reduce((a, b) => a + b.votes, 0));
        console.log('Votes Cast:', cData.votes_cast);

        console.log('Parties:');
        Object.entries(cData.parties).sort((a, b) => b[1].votes - a[1].votes).forEach(([pid, val]) => {
            const votes = val.votes;
            const pct = (votes / cData.votes_cast) * 100;
            console.log(`${pid}: ${votes} (${pct.toFixed(2)}%)`);
        });
    }

} catch (err) {
    console.error(err);
}
