const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const admin = require('firebase-admin');

// Configuration Firebase
const SERVICE_ACCOUNT = path.join(__dirname, 'serviceAccountKey.json');
if (!fs.existsSync(SERVICE_ACCOUNT)) {
    console.error(`Fichier de clé de service introuvable : ${SERVICE_ACCOUNT}`);
    process.exit(1);
}

const serviceAccount = require(SERVICE_ACCOUNT);
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();

/**
 * Génère un code unique de 8 caractères hexadécimaux en majuscules.
 */
function generateCode() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
}

async function run() {
    try {
        const inputPath = path.join(__dirname, 'output.json');
        const outputPath = path.join(__dirname, 'oldCodes.json');

        console.log(`Chargement de ${inputPath}...`);
        const data = JSON.parse(fs.readFileSync(inputPath, 'utf8'));

        // Indexation des utilisateurs par UserID
        const usersMap = {};
        if (data.users && Array.isArray(data.users)) {
            data.users.forEach(user => {
                usersMap[user.UserID] = {
                    firstName: user.FirstName,
                    lastName: user.LastName,
                    phone: user.PhoneIG
                };
            });
        }

        console.log("Récupération des données depuis Firestore...");
        
        // Récupération des collections (sets) de la BDD
        const collectionsSnapshot = await db.collection('collections').get();
        const dbCollectionsByName = {}; // name -> id
        const dbCollectionsById = {};   // id -> data
        collectionsSnapshot.forEach(doc => {
            const colData = doc.data();
            dbCollectionsByName[colData.name] = doc.id;
            dbCollectionsById[doc.id] = colData;
        });
        console.log(`${Object.keys(dbCollectionsById).length} collections récupérées depuis Firestore.`);

        // Récupération des cartes de la BDD
        const cardsSnapshot = await db.collection('cards').get();
        const dbCardsById = {}; // docId -> data
        const dbCardsByName = {}; // name -> docId
        cardsSnapshot.forEach(doc => {
            const cardData = doc.data();
            dbCardsById[doc.id] = cardData;
            dbCardsByName[cardData.name] = doc.id;
        });
        console.log(`${Object.keys(dbCardsById).length} cartes récupérées depuis Firestore.`);

        // Mapping CardID (output.json) -> { dbCardId, dbCollectionId }
        const outputCardToDbMap = {};
        if (data.cards && Array.isArray(data.cards)) {
            data.cards.forEach(card => {
                // Tentative 1: Match par ID conventionnel (SET-X_C-XXXXXX)
                const conventionId = `${card.SetID}_${card.CardID}`;
                let dbCardId = dbCardsById[conventionId] ? conventionId : null;

                // Tentative 2: Match par nom (Attention: output.json contient souvent "Numéro - Nom")
                if (!dbCardId) {
                    const cleanName = card.Name.replace(/^\d+\s*-\s*/, ''); // Retire "1 - "
                    dbCardId = dbCardsByName[cleanName] || dbCardsByName[card.Name];
                }
                
                // Mapping de la collection
                let dbCollectionId = dbCollectionsByName[card.SetName];
                if (!dbCollectionId && dbCardId) {
                    dbCollectionId = dbCardsById[dbCardId].collection;
                }

                if (dbCardId) {
                    outputCardToDbMap[card.CardID] = {
                        cardId: dbCardId,
                        collectionId: dbCollectionId
                    };
                }
            });
        }

        const result = {};
        const usedCodes = new Set();
        const userCollectionsHoldings = data.collections || {};

        console.log("Génération des codes...");

        for (const userId in userCollectionsHoldings) {
            const holdings = userCollectionsHoldings[userId];
            const collectionsSet = new Set();
            const cards = {};

            for (const cardId in holdings) {
                const quantity = parseInt(holdings[cardId]);
                if (quantity > 0) {
                    const dbMapping = outputCardToDbMap[cardId];
                    if (dbMapping) {
                        cards[dbMapping.cardId] = quantity;
                        if (dbMapping.collectionId) {
                            collectionsSet.add(dbMapping.collectionId);
                        }
                    }
                }
            }

            if (Object.keys(cards).length > 0) {
                let code;
                do {
                    code = generateCode();
                } while (usedCodes.has(code));
                usedCodes.add(code);

                const userInfo = usersMap[userId] || {};

                result[code] = {
                    userId: userId,
                    firstName: userInfo.firstName || '',
                    lastName: userInfo.lastName || '',
                    phone: userInfo.phone || '',
                    collections: Array.from(collectionsSet),
                    cards: cards
                };
            }
        }

        fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
        console.log(`Succès ! ${Object.keys(result).length} codes générés dans ${outputPath}`);
        process.exit(0);

    } catch (error) {
        console.error('Une erreur est survenue :', error);
        process.exit(1);
    }
}

run();
