const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json");

// Initialisation de Firebase Admin
if (!admin.apps.length) {
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount)
	});
}

const db = admin.firestore();

async function deleteOldLogs() {
	console.log("Démarrage du nettoyage des logs...");
	const collectionRef = db.collection('logs');
	const batchSize = 500;

	// Requête pour cibler les logs de type UPGRADE ou DOWNGRADE
	// .limit(batchSize) permet de traiter par lots pour éviter de surcharger la mémoire
	const query = collectionRef.where('type', 'in', ['UPGRADE', 'DOWNGRADE']).limit(batchSize);

	let totalDeleted = 0;

	while (true) {
		const snapshot = await query.get();

		if (snapshot.empty) {
			console.log("Aucun log correspondant trouvé ou tout a été nettoyé.");
			break;
		}

		const batch = db.batch();
		snapshot.docs.forEach(doc => {
			batch.delete(doc.ref);
		});

		await batch.commit();
		totalDeleted += snapshot.size;
		console.log(`Supprimé ${snapshot.size} logs... Total supprimé: ${totalDeleted}`);
	}

	console.log(`Nettoyage terminé. ${totalDeleted} logs supprimés au total.`);
}

deleteOldLogs().then(() => {
	console.log("Script terminé avec succès.");
	process.exit(0);
}).catch((error) => {
	console.error("Erreur lors de la suppression des logs:", error);
	process.exit(1);
});
