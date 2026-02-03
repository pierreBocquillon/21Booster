const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const SERVICE_ACCOUNT = path.join(__dirname, 'serviceAccountKey.json');
const BACKUP_FILE = path.join(__dirname, `backup_${new Date().toISOString().split('T')[0]}_${new Date().getHours()}h${new Date().getMinutes()}.json`);

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

async function backupCollection(collectionName) {
    console.log(`Récupération de la collection : ${collectionName}...`);
    const snapshot = await db.collection(collectionName).get();
    const data = {};
    snapshot.forEach(doc => {
        data[doc.id] = doc.data();
    });
    return data;
}

async function main() {
    try {
        // Liste des collections à sauvegarder
        // On peut soit les lister manuellement, soit essayer de les lister dynamiquement
        const collections = await db.listCollections();
        const backupData = {};

        for (const collection of collections) {
            const collectionId = collection.id;
            backupData[collectionId] = await backupCollection(collectionId);
        }

        fs.writeFileSync(BACKUP_FILE, JSON.stringify(backupData, null, 2));
        console.log(`\nSauvegarde terminée avec succès !`);
        console.log(`Fichier généré : ${BACKUP_FILE}`);
        
        const stats = Object.keys(backupData).map(k => `${k}: ${Object.keys(backupData[k]).length} docs`);
        console.log(`Statistiques : ${stats.join(', ')}`);

    } catch (error) {
        console.error("Erreur pendant la sauvegarde :", error);
        process.exit(1);
    }
}

main();
