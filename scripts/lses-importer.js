const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, 'lses.csv');
const outputPath = path.join(__dirname, 'lses.json');

if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
}

const content = fs.readFileSync(csvPath, 'utf8');
const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

// Skip header
const headerLine = lines.shift();

function parseCsvLine(line) {
    const result = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            // Handle escaped double quotes by checking if the next char is also a double quote
            if (inQuotes && line[i + 1] === '"') {
                cur += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(cur.trim());
            cur = '';
        } else {
            cur += char;
        }
    }
    result.push(cur.trim());
    return result;
}

const results = lines.map(line => {
    const cols = parseCsvLine(line);
    // Expected structure based on header:
    // amount, image, bg, description, type1, type2, name, id, stars, starsCount
    // 0       1      2    3            4      5      6     7   8      9
    
    const name = cols[6];
    const id = cols[7];
    const starsCountPath = cols[9] || '';
    
    // Extract stars number from path like "%PROJECT%/stars_5.png"
    const starsMatch = starsCountPath.match(/stars_(\d+)\.png/);
    const stars = starsMatch ? parseInt(starsMatch[1]) : 1;

    let type = 'common';
    if (stars === 5) {
        type = 'mythic';
    } else if (stars === 4) {
        type = 'rare';
    } else if (stars === 3) {
        type = 'uncommon';
    } else {
        type = 'common';
    }

    return {
        id: `LSES_${id}`,
        collection: 'lses',
        image: `LSES-${id}.png`,
        name: name,
        number: parseInt(id),
        type: type
    };
});

fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
console.log(`Successfully generated ${results.length} entries in ${outputPath}`);
