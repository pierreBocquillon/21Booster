const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

const JSON_FILE = path.join(__dirname, 'lses.json');
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

async function main() {
  if (!fs.existsSync(JSON_FILE)) {
    console.error(`Fichier JSON introuvable : ${JSON_FILE}`);
    process.exit(1);
  }

  const rawData = fs.readFileSync(JSON_FILE, 'utf-8');
  const cards = JSON.parse(rawData);

  console.log(`Début de l'importation de ${cards.length} cartes...`);

  const batchSize = 500; // Firestore limit is 500 operations per batch
  let batch = db.batch();
  let count = 0;

  for (const card of cards) {
    const docRef = db.collection('cards').doc(card.id);
    batch.set(docRef, {
      collection: card.collection,
      image: card.image,
      name: card.name,
      number: card.number,
      type: card.type
    });

    count++;
    if (count % batchSize === 0) {
      await batch.commit();
      console.log(`Batch de ${count} cartes envoyé...`);
      batch = db.batch();
    }
  }

  // Envoyer le dernier batch s'il en reste
  if (count % batchSize !== 0) {
    await batch.commit();
  }

  console.log(`Importation terminée ! ${count} cartes ont été chargées dans la collection "cards".`);
}

main().catch(err => {
  console.error("Erreur lors de l'importation :", err);
  process.exit(1);
});
