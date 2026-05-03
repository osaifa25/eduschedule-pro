/**
 * Utilitaire d'export Excel
 * Permet d'exporter les données en fichier .xlsx
 * EduSchedule Pro — ISGE RST 2025-2026
 */
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

/**
 * Exporte un tableau de données en fichier Excel
 * @param {Array} donnees - Tableau d'objets à exporter
 * @param {string} nomFeuille - Nom de la feuille Excel
 * @param {string} nomFichier - Nom du fichier téléchargé
 */
export const exporterExcel = (donnees, nomFeuille, nomFichier) => {
  // Créer un nouveau classeur Excel
  const classeur = XLSX.utils.book_new();

  // Convertir les données en feuille Excel
  const feuille = XLSX.utils.json_to_sheet(donnees);

  // Définir la largeur des colonnes automatiquement
  const largeurs = Object.keys(donnees[0] || {}).map(key => ({
    wch: Math.max(key.length, 15)
  }));
  feuille['!cols'] = largeurs;

  // Ajouter la feuille au classeur
  XLSX.utils.book_append_sheet(classeur, feuille, nomFeuille);

  // Générer le fichier binaire
  const excelBuffer = XLSX.write(classeur, { bookType: 'xlsx', type: 'array' });

  // Télécharger le fichier
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, `${nomFichier}_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.xlsx`);
};

/**
 * Exporte plusieurs feuilles dans un seul fichier Excel
 * @param {Array} feuilles - Tableau de {nom, donnees}
 * @param {string} nomFichier - Nom du fichier
 */
export const exporterExcelMultiFeuilles = (feuilles, nomFichier) => {
  const classeur = XLSX.utils.book_new();

  feuilles.forEach(({ nom, donnees }) => {
    if (donnees && donnees.length > 0) {
      const feuille = XLSX.utils.json_to_sheet(donnees);
      const largeurs = Object.keys(donnees[0] || {}).map(key => ({
        wch: Math.max(key.length, 15)
      }));
      feuille['!cols'] = largeurs;
      XLSX.utils.book_append_sheet(classeur, feuille, nom);
    }
  });

  const excelBuffer = XLSX.write(classeur, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([excelBuffer], { type: 'application/octet-stream' });
  saveAs(blob, `${nomFichier}_${new Date().toLocaleDateString('fr-FR').replace(/\//g, '-')}.xlsx`);
};