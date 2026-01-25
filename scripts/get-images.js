
// --- Dépendances ---
const fs = require('fs');
const path = require('path');
const https = require('https');

// --- Constantes ---
const OUTPUT_FILE = path.join(__dirname, 'output.json');
const IMAGES_DIR = path.join(__dirname, 'cardImages');
const CONCURRENCY = 5; // Nombre de téléchargements simultanés

// --- Utilitaires ---
// Crée le dossier d'images s'il n'existe pas
if (!fs.existsSync(IMAGES_DIR)) {
    fs.mkdirSync(IMAGES_DIR, { recursive: true });
}


// Nettoie un nom de fichier (à adapter si besoin)
const sanitizeFilename = (name) => name;

// Télécharge une image depuis une URL
function downloadImage(url, filepath) {
    return new Promise((resolve, reject) => {
        const request = https.get(url, (response) => {
            // Gère les redirections
            if ([301, 302, 303, 307].includes(response.statusCode)) {
                downloadImage(response.headers.location, filepath)
                    .then(resolve)
                    .catch(reject);
                return;
            }
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to get '${url}' (${response.statusCode})`));
                return;
            }
            const file = fs.createWriteStream(filepath);
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        });
        request.on('error', (err) => {
            fs.unlink(filepath, () => {});
            reject(err);
        });
    });
}

// Exécute des tâches asynchrones avec une limite de concurrence
async function runWithConcurrencyLimit(tasks, limit) {
    let running = 0;
    let current = 0;
    return new Promise((resolve) => {
        let finished = 0;
        function next() {
            while (running < limit && current < tasks.length) {
                running++;
                const taskIndex = current++;
                tasks[taskIndex]().then(() => {
                    running--;
                    finished++;
                    if (finished === tasks.length) {
                        resolve();
                    } else {
                        next();
                    }
                }).catch(() => {
                    running--;
                    finished++;
                    if (finished === tasks.length) {
                        resolve();
                    } else {
                        next();
                    }
                });
            }
        }
        next();
    });
}

// --- Script principal ---
async function main() {
    try {
        if (!fs.existsSync(OUTPUT_FILE)) {
            console.error(`Error: ${OUTPUT_FILE} not found.`);
            return;
        }
        console.log('Lecture de output.json...');
        const rawData = fs.readFileSync(OUTPUT_FILE, 'utf-8');
        const data = JSON.parse(rawData);
        if (!data.cards || !Array.isArray(data.cards)) {
            console.error('Erreur : tableau "cards" introuvable dans output.json');
            return;
        }
        console.log(`Nombre de cartes à traiter : ${data.cards.length}`);

        let successCount = 0;
        let skipCount = 0;
        let failCount = 0;

        // Prépare les tâches de téléchargement
        const tasks = data.cards.map((card, i) => async () => {
            if (!card.ImageURL) {
                console.warn(`Carte ignorée ${card.CardID} (${card.Name}) : pas d'ImageURL`);
                skipCount++;
                return;
            }
            const setId = sanitizeFilename(card.SetID || 'UNKNOWN_SET');
            const cardId = sanitizeFilename(card.CardID || 'UNKNOWN_CARD');
            const filename = `${setId}_${cardId}.jpg`;
            const filepath = path.join(IMAGES_DIR, filename);
            if (fs.existsSync(filepath)) {
                console.log(`Fichier déjà existant ignoré : ${filename}`);
                skipCount++;
                return;
            }
            try {
                console.log(`Téléchargement ${i + 1}/${data.cards.length} : ${filename} depuis ${card.ImageURL}`);
                await downloadImage(card.ImageURL, filepath);
                successCount++;
            } catch (error) {
                console.error(`Échec du téléchargement ${filename} :`, error.message);
                failCount++;
            }
        });

        await runWithConcurrencyLimit(tasks, CONCURRENCY);

        // Résumé
        console.log('\n--- Résumé du téléchargement ---');
        console.log(`Total traité : ${data.cards.length}`);
        console.log(`Succès : ${successCount}`);
        console.log(`Ignorés : ${skipCount}`);
        console.log(`Échecs : ${failCount}`);
    } catch (error) {
        console.error('Erreur inattendue :', error);
    }
}

main();
