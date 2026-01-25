const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

/**
 * CONFIGURATION
 */
const BACKUP_FILE = path.join(__dirname, 'backup_2026-01-23.json'); // Modifier par le nom de votre fichier
const WIPE_USERS = false; // Si true, supprime les données users avant de charger. Attention !
const SERVICE_ACCOUNT = path.join(__dirname, 'serviceAccountKey.json');

if (!fs.existsSync(SERVICE_ACCOUNT)) {
    console.error(`Fichier de clé de service introuvable : ${SERVICE_ACCOUNT}`);
    process.exit(1);
}

// Initialisation Firebase Admin
const serviceAccount = require(SERVICE_ACCOUNT);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

async function deleteCollection(collectionPath, batchSize = 500) {
    const collectionRef = db.collection(collectionPath);
    const query = collectionRef.orderBy('__name__').limit(batchSize);

    return new Promise((resolve, reject) => {
        deleteQueryBatch(db, query, resolve).catch(reject);
    });
}

async function deleteQueryBatch(db, query, resolve) {
    const snapshot = await query.get();

    const batchSize = snapshot.size;
    if (batchSize === 0) {
        resolve();
        return;
    }

    const batch = db.batch();
    snapshot.docs.forEach((doc) => {
        batch.delete(doc.ref);
    });
    await batch.commit();

    process.nextTick(() => {
        deleteQueryBatch(db, query, resolve);
    });
}

async function main() {
    if (!fs.existsSync(BACKUP_FILE)) {
        console.error(`Backup file not found: ${BACKUP_FILE}`);
        process.exit(1);
    }

    const backupData = JSON.parse(fs.readFileSync(BACKUP_FILE, 'utf8'));
    const collections = Object.keys(backupData);

    console.log(`Starting restoration from ${BACKUP_FILE}...`);

    for (const collectionName of collections) {
        // Logique spécifique pour le wipe
        if (collectionName === 'users') {
            if (WIPE_USERS) {
                console.log(`Wiping collection: ${collectionName}...`);
                await deleteCollection(collectionName);
            } else {
                console.log(`Skipping wipe for collection: ${collectionName} (WIPE_USERS is false)`);
            }
        } else {
            // Par défaut on wipe les autres collections (ou on merge, ici on va merge par sécurité si pas spécifié)
            console.log(`Importing to collection: ${collectionName}...`);
        }

        const documents = backupData[collectionName];
        const docIds = Object.keys(documents);
        
        let batch = db.batch();
        let count = 0;

        for (const id of docIds) {
            const docRef = db.collection(collectionName).doc(id);
            batch.set(docRef, documents[id]);
            count++;

            if (count % 500 === 0) {
                await batch.commit();
                batch = db.batch();
                console.log(`  Progress ${collectionName}: ${count} docs...`);
            }
        }

        if (count % 500 !== 0) {
            await batch.commit();
        }
        console.log(`Restored ${count} documents in ${collectionName}.`);
    }

    console.log("\nRestoration complete.");
}

main().catch(err => {
    console.error("Error during restoration:", err);
    process.exit(1);
});
