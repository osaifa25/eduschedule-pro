/**
 * Page Rapports et Export Excel
 * Permet d'exporter toutes les données en fichiers Excel
 * EduSchedule Pro — ISGE RST 2025-2026
 */
import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { exporterExcel, exporterExcelMultiFeuilles } from '../utils/exportExcel';

export default function RapportsPage() {
  // États pour stocker les données
  const [classes,     setClasses]     = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [matieres,    setMatieres]    = useState([]);
  const [salles,      setSalles]      = useState([]);
  const [vacations,   setVacations]   = useState([]);
  const [cahiers,     setCahiers]     = useState([]);
  const [chargement,  setChargement]  = useState(false);

  // Chargement des données au démarrage
  useEffect(() => {
    api.get('/classes.php').then(r     => setClasses(r.data.data)).catch(() => {});
    api.get('/enseignants.php').then(r => setEnseignants(r.data.data)).catch(() => {});
    api.get('/matieres.php').then(r    => setMatieres(r.data.data)).catch(() => {});
    api.get('/salles.php').then(r      => setSalles(r.data.data)).catch(() => {});
    api.get('/vacations.php').then(r   => setVacations(r.data.data)).catch(() => {});
    api.get('/cahiers.php').then(r     => setCahiers(r.data.data)).catch(() => {});
  }, []);

  // Export des enseignants
  const exporterEnseignants = () => {
    const donnees = enseignants.map(e => ({
      'Matricule':     e.matricule,
      'Nom':           e.nom,
      'Prénom':        e.prenom,
      'Email':         e.email,
      'Spécialité':    e.specialite,
      'Statut':        e.statut,
      'Taux horaire':  e.taux_horaire + ' FCFA'
    }));
    exporterExcel(donnees, 'Enseignants', 'Liste_Enseignants');
  };

  // Export des classes
  const exporterClasses = () => {
    const donnees = classes.map(c => ({
      'Code':              c.code,
      'Libellé':           c.libelle,
      'Niveau':            c.niveau,
      'Année académique':  c.annee_academique
    }));
    exporterExcel(donnees, 'Classes', 'Liste_Classes');
  };

  // Export des vacations
  const exporterVacations = () => {
    const moisNoms = ['','Janvier','Février','Mars','Avril','Mai','Juin',
                      'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
    const donnees = vacations.map(v => ({
      'Enseignant':     v.prenom + ' ' + v.nom,
      'Mois':           moisNoms[v.mois],
      'Année':          v.annee,
      'Montant brut':   parseFloat(v.montant_brut).toLocaleString() + ' FCFA',
      'Montant net':    parseFloat(v.montant_net).toLocaleString() + ' FCFA',
      'Statut':         v.statut,
      'Date génération': new Date(v.date_generation).toLocaleDateString('fr-FR')
    }));
    exporterExcel(donnees, 'Vacations', 'Fiches_Vacation');
  };

  // Export des cahiers de texte
  const exporterCahiers = () => {
    const donnees = cahiers.map(c => ({
      'Matière':    c.matiere,
      'Classe':     c.classe,
      'Jour':       c.jour,
      'Heure':      c.heure_debut?.slice(0,5),
      'Titre':      c.titre_cours || 'Sans titre',
      'Statut':     c.statut,
      'Date':       new Date(c.date_creation).toLocaleDateString('fr-FR')
    }));
    exporterExcel(donnees, 'Cahiers', 'Cahiers_Texte');
  };

  // Export complet — toutes les données
  const exporterTout = async () => {
    setChargement(true);
    try {
      const moisNoms = ['','Janvier','Février','Mars','Avril','Mai','Juin',
                        'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];
      exporterExcelMultiFeuilles([
        {
          nom: 'Enseignants',
          donnees: enseignants.map(e => ({
            'Matricule':    e.matricule,
            'Nom':          e.nom,
            'Prénom':       e.prenom,
            'Email':        e.email,
            'Spécialité':   e.specialite,
            'Statut':       e.statut,
            'Taux horaire': e.taux_horaire + ' FCFA'
          }))
        },
        {
          nom: 'Classes',
          donnees: classes.map(c => ({
            'Code':    c.code,
            'Libellé': c.libelle,
            'Niveau':  c.niveau,
            'Année':   c.annee_academique
          }))
        },
        {
          nom: 'Matières',
          donnees: matieres.map(m => ({
            'Code':           m.code,
            'Libellé':        m.libelle,
            'Volume horaire': m.volume_horaire_total + 'h',
            'Coefficient':    m.coefficient
          }))
        },
        {
          nom: 'Salles',
          donnees: salles.map(s => ({
            'Code':        s.code,
            'Capacité':    s.capacite + ' places',
            'Équipements': s.equipements,
            'Bâtiment':    s.batiment
          }))
        },
        {
          nom: 'Vacations',
          donnees: vacations.map(v => ({
            'Enseignant':  v.prenom + ' ' + v.nom,
            'Mois':        moisNoms[v.mois],
            'Année':       v.annee,
            'Montant brut': parseFloat(v.montant_brut).toLocaleString() + ' FCFA',
            'Montant net':  parseFloat(v.montant_net).toLocaleString() + ' FCFA',
            'Statut':       v.statut
          }))
        },
        {
          nom: 'Cahiers de texte',
          donnees: cahiers.map(c => ({
            'Matière': c.matiere,
            'Classe':  c.classe,
            'Jour':    c.jour,
            'Titre':   c.titre_cours || 'Sans titre',
            'Statut':  c.statut
          }))
        }
      ], 'EduSchedule_Pro_Rapport_Complet');
    } finally {
      setChargement(false);
    }
  };

  // Cartes d'export
  const cartes = [
    {
      titre:       'Enseignants',
      description: `${enseignants.length} enseignants`,
      icon:        '👨‍🏫',
      couleur:     '#3b82f6',
      action:      exporterEnseignants
    },
    {
      titre:       'Classes',
      description: `${classes.length} classes`,
      icon:        '🏫',
      couleur:     '#10b981',
      action:      exporterClasses
    },
    {
      titre:       'Fiches de Vacation',
      description: `${vacations.length} fiches`,
      icon:        '💰',
      couleur:     '#f59e0b',
      action:      exporterVacations
    },
    {
      titre:       'Cahiers de Texte',
      description: `${cahiers.length} cahiers`,
      icon:        '📝',
      couleur:     '#8b5cf6',
      action:      exporterCahiers
    }
  ];

  return (
    <div style={{ padding: 32 }}>

      {/* En-tête */}
      <div style={{ marginBottom: 32 }}>
        <h4 style={{ margin: 0, fontWeight: 800, color: '#1e293b' }}>
          📊 Rapports & Export Excel
        </h4>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
          Exportez vos données en fichiers Excel (.xlsx)
        </p>
      </div>

      {/* Bouton export complet */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a5f, #3b82f6)',
        borderRadius: 16, padding: 24, marginBottom: 32, color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h5 style={{ fontWeight: 800, margin: 0 }}>📦 Export Complet</h5>
            <p style={{ opacity: 0.85, margin: '4px 0 0' }}>
              Toutes les données dans un seul fichier Excel (6 feuilles)
            </p>
          </div>
          <button onClick={exporterTout} disabled={chargement} style={{
            background: '#fbbf24', color: '#1e293b',
            border: 'none', borderRadius: 10,
            padding: '12px 24px', fontWeight: 700,
            cursor: 'pointer', fontSize: '1rem'
          }}>
            {chargement ? '⏳ Export...' : '📥 Tout exporter'}
          </button>
        </div>
      </div>

      {/* Cartes d'export individuels */}
      <div className="row g-3 mb-4">
        {cartes.map(carte => (
          <div key={carte.titre} className="col-md-6 col-lg-3">
            <div style={{
              background: 'white', borderRadius: 16, padding: 24,
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
              borderTop: `4px solid ${carte.couleur}`,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '2.5rem', marginBottom: 12 }}>{carte.icon}</div>
              <h6 style={{ fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>
                {carte.titre}
              </h6>
              <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: 16 }}>
                {carte.description}
              </p>
              <button onClick={carte.action} style={{
                background: carte.couleur, color: 'white',
                border: 'none', borderRadius: 8,
                padding: '8px 20px', fontWeight: 600,
                cursor: 'pointer', width: '100%'
              }}>
                📥 Exporter
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Résumé des données */}
      <div style={{
        background: 'white', borderRadius: 16, padding: 24,
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
      }}>
        <h6 style={{ fontWeight: 700, marginBottom: 16, color: '#1e293b' }}>
          📋 Résumé des données disponibles
        </h6>
        <table className="table table-bordered mb-0">
          <thead className="table-light">
            <tr>
              <th>Données</th>
              <th>Nombre d'enregistrements</th>
              <th>Format d'export</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>👨‍🏫 Enseignants</td><td>{enseignants.length}</td><td>Excel (.xlsx)</td></tr>
            <tr><td>🏫 Classes</td><td>{classes.length}</td><td>Excel (.xlsx)</td></tr>
            <tr><td>📚 Matières</td><td>{matieres.length}</td><td>Excel (.xlsx)</td></tr>
            <tr><td>🚪 Salles</td><td>{salles.length}</td><td>Excel (.xlsx)</td></tr>
            <tr><td>💰 Fiches vacation</td><td>{vacations.length}</td><td>Excel (.xlsx)</td></tr>
            <tr><td>📝 Cahiers de texte</td><td>{cahiers.length}</td><td>Excel (.xlsx)</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}