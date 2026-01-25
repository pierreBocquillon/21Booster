const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = path.join(__dirname, 'output.json');
const IMAGES_DIR = path.join(__dirname, 'cardImages');
const RESULT_FILE = path.join(__dirname, 'import-ready.json');

function main() {
    if (!fs.existsSync(OUTPUT_FILE)) {
        console.error(`Fichier introuvable : ${OUTPUT_FILE}`);
        process.exit(1);
    }
    if (!fs.existsSync(IMAGES_DIR)) {
        console.error(`Dossier introuvable : ${IMAGES_DIR}`);
        process.exit(1);
    }

    const rawData = fs.readFileSync(OUTPUT_FILE, 'utf-8');
    const data = JSON.parse(rawData);
    if (!data.cards || !Array.isArray(data.cards)) {
        console.error('Erreur : tableau "cards" introuvable dans output.json');
        process.exit(1);
    }

    // Récupère la liste des fichiers images
    const imageFiles = new Set(fs.readdirSync(IMAGES_DIR));

    // Récupère les collections uniques
    const collections = {};
    const cards = [];

    data.cards.forEach(card => {
        const setId = card.SetID || 'UNKNOWN_SET';
        const cardId = card.CardID || 'UNKNOWN_CARD';
        const filename = `${setId}_${cardId}.jpg`;
        if (!collections[setId]) {
            collections[setId] = {
                setId,
                setName: card.SetName || setId
            };
        }
        // Sépare le numéro et le nom
        let number = null;
        let name = card.Name || '';
        const match = name.match(/^\s*(\d+)\s*[-–]\s*(.+)$/);
        if (match) {
            number = match[1];
            name = match[2];
        }
        cards.push({
            cardId,
            setId,
            number,
            name,
            rarity: card.RarityName || null,
            image: imageFiles.has(filename) ? filename : null
        });
    });

    const result = {
        collections: Object.values(collections),
        cards
    };

    for(let col of result.collections) {
        col.dbId = ""
    }

    fs.writeFileSync(RESULT_FILE, JSON.stringify(result, null, 2), 'utf-8');
    console.log(`Fichier généré : ${RESULT_FILE}`);
}

main();
