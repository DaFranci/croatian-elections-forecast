const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'public/data/elections/2024-parliamentary.json');

try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    if (!data.constituencies) {
        console.log('No constituencies field found in JSON!');
        console.log('Keys in data:', Object.keys(data));
        process.exit(0);
    }

    console.log('Constituency keys:', Object.keys(data.constituencies));

    const targetKey = Object.keys(data.constituencies).find(k => k.includes('III') || k === '3');
    console.log('Found key for III:', targetKey);

    if (targetKey) {
        const cData = data.constituencies[targetKey];
        // Calculate seats manually
        const SEATS = 14;
        const THRESHOLD = 5;

        let totalValid = 0;
        Object.values(cData.parties).forEach(p => totalValid += p.votes);

        console.log(`\nAnalysis for ${targetKey}:`);
        console.log(`Total Valid Votes: ${totalValid}`);

        const qualifying = Object.entries(cData.parties)
            .map(([id, p]) => ({ id, votes: p.votes, pct: (p.votes / totalValid) * 100 }))
            .filter(p => p.pct >= THRESHOLD)
            .sort((a, b) => b.votes - a.votes);

        console.log('\nQualifying Parties (>5%):');
        qualifying.forEach(p => console.log(`${p.id}: ${p.votes} (${p.pct.toFixed(2)}%)`));

        // D'Hondt
        const quotients = [];
        qualifying.forEach(p => {
            for (let i = 1; i <= SEATS; i++) {
                quotients.push({ id: p.id, val: p.votes / i });
            }
        });
        quotients.sort((a, b) => b.val - a.val);

        const seats = {};
        quotients.slice(0, SEATS).forEach(q => {
            seats[q.id] = (seats[q.id] || 0) + 1;
        });

        console.log('\nAllocated Seats:');
        let totalSeats = 0;
        Object.entries(seats).forEach(([id, count]) => {
            console.log(`${id}: ${count}`);
            totalSeats += count;
        });
        console.log(`Total Seats: ${totalSeats}`);
    }

} catch (err) {
    console.error(err);
}
