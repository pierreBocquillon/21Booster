const fs = require('fs');
const path = require('path');

// Chemins des fichiers
const inputPath = path.join(__dirname, 'oldCodes.json');
const outputPath = path.join(__dirname, 'oldCodes_Export.csv');

try {
    // Lecture du fichier JSON
    console.log('Lecture du fichier oldCodes.json...');
    if (!fs.existsSync(inputPath)) {
        console.error(`Erreur : Le fichier ${inputPath} n'existe pas.`);
        process.exit(1);
    }
    
    const rawData = fs.readFileSync(inputPath, 'utf8');
    const oldCodes = JSON.parse(rawData);

    // Préparation du contenu CSV
    // Utilisation du BOM \uFEFF pour que Excel reconnaisse l'encodage UTF-8
    // Utilisation du point-virgule ';' comme séparateur (standard Excel FR)
    const SEPARATOR = ';';
    let csvContent = '\uFEFF'; 
    
    // En-têtes des colonnes
    csvContent += `NOM${SEPARATOR}Prenom${SEPARATOR}Telephone${SEPARATOR}code\n`;

    let count = 0;
    
    // Parcours des données
    for (const [code, user] of Object.entries(oldCodes)) {
        // Récupération et nettoyage des données (échappement des guillemets doubles)
        const nom = (user.lastName || '').replace(/"/g, '""').trim();
        const prenom = (user.firstName || '').replace(/"/g, '""').trim();
        const phone = (user.phone || '').toString().trim();
        
        // Ajout de la ligne (tous les champs entre guillemets)
        csvContent += `"${nom}"${SEPARATOR}"${prenom}"${SEPARATOR}"555-${phone}"${SEPARATOR}"${code}"\n`;
        count++;
    }

    // Écriture du fichier
    fs.writeFileSync(outputPath, csvContent, 'utf8');
    
    console.log(`Terminé ! ${count} codes ont été exportés.`);
    console.log(`Fichier créé : ${outputPath}`);

} catch (error) {
    console.error('Une erreur est survenue :', error);
}
