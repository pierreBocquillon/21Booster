const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');
const { doc } = require('firebase/firestore');

const IMPORT_FILE = path.join(__dirname, 'import-ready.json');
const SERVICE_ACCOUNT = path.join(__dirname, 'serviceAccountKey.json');

// Initialisation Firebase
const serviceAccount = require(SERVICE_ACCOUNT);
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

function getType(rarity) {
  switch (String(rarity).toLowerCase()) {
    case 'common':
    case '1':
      return 'common';
    case 'uncommon':
    case '2':
      return 'uncommon';
    case 'rare':
    case '3':
      return 'rare';
    case 'mythic':
    case '4':
      return 'mythic';
    default:
      return 'common';
  }
}

async function main() {
  if (!fs.existsSync(IMPORT_FILE)) {
    console.error(`Fichier introuvable : ${IMPORT_FILE}`);
    process.exit(1);
  }
  const rawData = fs.readFileSync(IMPORT_FILE, 'utf-8');
  const data = JSON.parse(rawData);
  if (!data.collections || !data.cards) {
    console.error('Format de import-ready.json incorrect.');
    process.exit(1);
  }

  // Map des dbId pour chaque setId
  const setDbIdMap = {};
  data.collections.forEach(set => {
    setDbIdMap[set.setId] = set.dbId || set.setId;
  });

  for (const card of data.cards) {
    const docId = `${card.setId}_${card.cardId}`;
    const cardRef = db.collection('cards').doc(docId);
    const docSnap = await cardRef.get();

    if (docSnap.exists) {
      // console.log(`Sauté (existe déjà) : ${docId}`);
      continue;
    }

    const collection = setDbIdMap[card.setId];
    const type = getType(card.rarity);
    const docData = {
      collection,
      image: card.image,
      name: card.name,
      number: card.number,
      type: type,
    };
    await cardRef.set(docData);
    console.log(`Ajouté : ${docId}`);
  }
  console.log('Import terminé.');
}

main().catch(console.error);
