/**
 * Page Emploi du Temps
 * Création, modification et suppression des plannings
 * EduSchedule Pro — ISGE RST 2025-2026
 */
import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function EmploiTempsPage() {
  const { user } = useAuth();

  // États principaux
  const [emplois,     setEmplois]     = useState([]);
  const [classes,     setClasses]     = useState([]);
  const [matieres,    setMatieres]    = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [salles,      setSalles]      = useState([]);

  // États de filtrage et affichage
  const [filtreClasse, setFiltreClasse] = useState('');
  const [showForm,     setShowForm]     = useState(false);
  const [conflits,     setConflits]     = useState([]);

  // État pour la modification d'un créneau
  const [creneauModif, setCreneauModif] = useState(null);

  // Formulaire de création d'emploi du temps
  const [form, setForm] = useState({
    id_classe: '', semaine_debut: '', creneaux: []
  });

  // Formulaire pour un nouveau créneau
  const [nouveauCreneau, setNouveauCreneau] = useState({
    jour: 'Lundi', heure_debut: '08:00', heure_fin: '10:00',
    id_matiere: '', id_enseignant: '', id_salle: ''
  });

  // État pour le QR Code généré
  const [qrInfo, setQrInfo] = useState(null);

  // Chargement des données
  const charger = () => {
    const params = filtreClasse ? `?id_classe=${filtreClasse}` : '';
    api.get(`/emploi_temps.php${params}`).then(r => setEmplois(r.data.data)).catch(() => {});
  };

  useEffect(() => {
    api.get('/classes.php').then(r     => setClasses(r.data.data));
    api.get('/enseignants.php').then(r => setEnseignants(r.data.data));
    api.get('/salles.php').then(r      => setSalles(r.data.data));
    api.get('/matieres.php').then(r    => setMatieres(r.data.data));
  }, []);

  useEffect(() => { charger(); }, [filtreClasse]);

  // Ajouter un créneau au formulaire
  const ajouterCreneau = () => {
    if (!nouveauCreneau.id_matiere || !nouveauCreneau.id_enseignant || !nouveauCreneau.id_salle) {
      alert('Remplissez tous les champs du créneau'); return;
    }
    setForm(f => ({ ...f, creneaux: [...f.creneaux, { ...nouveauCreneau }] }));
    setNouveauCreneau({ jour: 'Lundi', heure_debut: '08:00', heure_fin: '10:00', id_matiere: '', id_enseignant: '', id_salle: '' });
  };

  // Supprimer un créneau du formulaire
  const supprimerCreneauForm = (index) => {
    setForm(f => ({ ...f, creneaux: f.creneaux.filter((_, i) => i !== index) }));
  };

  // Soumettre le formulaire de création
  const soumettre = async () => {
    if (!form.id_classe || !form.semaine_debut) {
      alert('Choisissez une classe et une semaine'); return;
    }
    try {
      const res = await api.post('/emploi_temps.php', form);
      if (res.data.conflits?.length > 0) {
        setConflits(res.data.conflits);
      } else {
        setConflits([]);
      }
      alert(res.data.message);
      setShowForm(false);
      setForm({ id_classe: '', semaine_debut: '', creneaux: [] });
      charger();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  // Publier un emploi du temps
  const publier = async (id) => {
    await api.put(`/emploi_temps.php?action=publier&id=${id}`);
    charger();
  };

  // Supprimer un emploi du temps entier
  const supprimerEmploi = async (id) => {
    if (!window.confirm('Supprimer cet emploi du temps et tous ses créneaux ?')) return;
    try {
      await api.delete(`/emploi_temps.php?id=${id}`);
      charger();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  // Générer le QR Code pour un créneau
  const genererQR = async (id) => {
    try {
      const res = await api.get(`/qrcode.php?id=${id}`);
      setQrInfo(res.data);
    } catch {
      alert('Erreur génération QR');
    }
  };

  // Supprimer un créneau existant
  const supprimerCreneau = async (id) => {
    if (!window.confirm('Supprimer ce créneau ?')) return;
    try {
      await api.delete(`/creneaux.php?id=${id}`);
      charger();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  // Modifier un créneau existant
  const modifierCreneau = async () => {
    if (!creneauModif) return;
    try {
      await api.put(`/creneaux.php?id=${creneauModif.id}`, creneauModif);
      alert('Créneau modifié !');
      setCreneauModif(null);
      charger();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  return (
    <div style={{ padding: 32 }}>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h4 style={{ margin: 0, fontWeight: 800, color: '#1e293b' }}>📅 Emploi du temps</h4>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
            Gestion des plannings hebdomadaires
          </p>
        </div>
        {user?.role === 'administrateur' && (
          <button onClick={() => setShowForm(!showForm)} style={{
            background: 'linear-gradient(135deg, #1a56db, #7e3af2)',
            color: 'white', border: 'none', borderRadius: 10,
            padding: '10px 20px', fontWeight: 600, cursor: 'pointer'
          }}>
            {showForm ? '✕ Annuler' : '+ Créer un emploi du temps'}
          </button>
        )}
      </div>

      {/* Alertes conflits */}
      {conflits.length > 0 && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: 12, padding: 16, marginBottom: 24
        }}>
          <strong style={{ color: '#ef4444' }}>⚠️ Conflits détectés :</strong>
          <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
            {conflits.map((c, i) => <li key={i} style={{ color: '#dc2626' }}>{c}</li>)}
          </ul>
        </div>
      )}

      {/* Modal QR Code */}
      {qrInfo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, textAlign: 'center', maxWidth: 400 }}>
            <h5 style={{ fontWeight: 700, marginBottom: 16 }}>📷 QR Code de la séance</h5>
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrInfo.token)}`}
              alt="QR Code" style={{ marginBottom: 16 }}
            />
            <p><strong>Token :</strong> <code style={{ fontSize: '0.75rem' }}>{qrInfo.token}</code></p>
            <p><strong>Expire :</strong> {qrInfo.expire}</p>
            <button onClick={() => setQrInfo(null)} style={{
              background: '#f1f5f9', border: 'none', borderRadius: 8,
              padding: '10px 24px', cursor: 'pointer', fontWeight: 600
            }}>
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* Modal modification créneau */}
      {creneauModif && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', zIndex: 9999,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, width: '90%', maxWidth: 500 }}>
            <h5 style={{ fontWeight: 700, marginBottom: 20 }}>✏️ Modifier le créneau</h5>
            <div className="row g-3">
              <div className="col-md-6">
                <label className="form-label">Jour</label>
                <select className="form-select" value={creneauModif.jour}
                  onChange={e => setCreneauModif(c => ({ ...c, jour: e.target.value }))}>
                  {JOURS.map(j => <option key={j}>{j}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label">Heure début</label>
                <input type="time" className="form-control" value={creneauModif.heure_debut}
                  onChange={e => setCreneauModif(c => ({ ...c, heure_debut: e.target.value }))} />
              </div>
              <div className="col-md-3">
                <label className="form-label">Heure fin</label>
                <input type="time" className="form-control" value={creneauModif.heure_fin}
                  onChange={e => setCreneauModif(c => ({ ...c, heure_fin: e.target.value }))} />
              </div>
              <div className="col-md-12">
                <label className="form-label">Matière</label>
                <select className="form-select" value={creneauModif.id_matiere}
                  onChange={e => setCreneauModif(c => ({ ...c, id_matiere: e.target.value }))}>
                  {matieres.map(m => <option key={m.id} value={m.id}>{m.libelle}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Enseignant</label>
                <select className="form-select" value={creneauModif.id_enseignant}
                  onChange={e => setCreneauModif(c => ({ ...c, id_enseignant: e.target.value }))}>
                  {enseignants.map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
                </select>
              </div>
              <div className="col-md-6">
                <label className="form-label">Salle</label>
                <select className="form-select" value={creneauModif.id_salle}
                  onChange={e => setCreneauModif(c => ({ ...c, id_salle: e.target.value }))}>
                  {salles.map(s => <option key={s.id} value={s.id}>{s.code}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setCreneauModif(null)} style={{
                background: '#f1f5f9', border: 'none', borderRadius: 8,
                padding: '10px 20px', cursor: 'pointer', fontWeight: 600
              }}>
                Annuler
              </button>
              <button onClick={modifierCreneau} style={{
                background: 'linear-gradient(135deg, #1a56db, #7e3af2)',
                color: 'white', border: 'none', borderRadius: 8,
                padding: '10px 20px', cursor: 'pointer', fontWeight: 600
              }}>
                💾 Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire création */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <h5 style={{ fontWeight: 700, marginBottom: 20 }}>Nouveau planning</h5>
          <div className="row g-2 mb-3">
            <div className="col-md-6">
              <label className="form-label">Classe</label>
              <select className="form-select" value={form.id_classe}
                onChange={e => setForm(f => ({ ...f, id_classe: e.target.value }))}>
                <option value="">Choisir une classe</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.libelle}</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label">Semaine du (lundi)</label>
              <input type="date" className="form-control" value={form.semaine_debut}
                onChange={e => setForm(f => ({ ...f, semaine_debut: e.target.value }))} />
            </div>
          </div>

          <h6>Ajouter un créneau</h6>
          <div className="row g-2 mb-2">
            <div className="col-md-2">
              <select className="form-select form-select-sm" value={nouveauCreneau.jour}
                onChange={e => setNouveauCreneau(n => ({ ...n, jour: e.target.value }))}>
                {JOURS.map(j => <option key={j}>{j}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <input type="time" className="form-control form-control-sm" value={nouveauCreneau.heure_debut}
                onChange={e => setNouveauCreneau(n => ({ ...n, heure_debut: e.target.value }))} />
            </div>
            <div className="col-md-2">
              <input type="time" className="form-control form-control-sm" value={nouveauCreneau.heure_fin}
                onChange={e => setNouveauCreneau(n => ({ ...n, heure_fin: e.target.value }))} />
            </div>
            <div className="col-md-2">
              <select className="form-select form-select-sm" value={nouveauCreneau.id_matiere}
                onChange={e => setNouveauCreneau(n => ({ ...n, id_matiere: e.target.value }))}>
                <option value="">Matière</option>
                {matieres.map(m => <option key={m.id} value={m.id}>{m.libelle}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select form-select-sm" value={nouveauCreneau.id_enseignant}
                onChange={e => setNouveauCreneau(n => ({ ...n, id_enseignant: e.target.value }))}>
                <option value="">Enseignant</option>
                {enseignants.map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
              </select>
            </div>
            <div className="col-md-2">
              <select className="form-select form-select-sm" value={nouveauCreneau.id_salle}
                onChange={e => setNouveauCreneau(n => ({ ...n, id_salle: e.target.value }))}>
                <option value="">Salle</option>
                {salles.map(s => <option key={s.id} value={s.id}>{s.code}</option>)}
              </select>
            </div>
          </div>
          <button onClick={ajouterCreneau} style={{
            background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe',
            borderRadius: 8, padding: '6px 16px', cursor: 'pointer', fontWeight: 600, marginBottom: 16
          }}>
            + Ajouter ce créneau
          </button>

          {form.creneaux.length > 0 && (
            <table className="table table-sm table-bordered mb-3">
              <thead className="table-light">
                <tr><th>Jour</th><th>Début</th><th>Fin</th><th>Matière</th><th>Enseignant</th><th>Salle</th><th></th></tr>
              </thead>
              <tbody>
                {form.creneaux.map((c, i) => (
                  <tr key={i}>
                    <td>{c.jour}</td>
                    <td>{c.heure_debut}</td>
                    <td>{c.heure_fin}</td>
                    <td>{matieres.find(m => m.id == c.id_matiere)?.libelle}</td>
                    <td>{enseignants.find(e => e.id == c.id_enseignant)?.nom}</td>
                    <td>{salles.find(s => s.id == c.id_salle)?.code}</td>
                    <td>
                      <button onClick={() => supprimerCreneauForm(i)}
                        style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <button onClick={soumettre} style={{
            background: '#10b981', color: 'white', border: 'none',
            borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer'
          }}>
            💾 Enregistrer l'emploi du temps
          </button>
        </div>
      )}

      {/* Filtre par classe */}
      <div style={{ marginBottom: 24 }}>
        <select className="form-select w-auto" value={filtreClasse}
          onChange={e => setFiltreClasse(e.target.value)}>
          <option value="">Toutes les classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.libelle}</option>)}
        </select>
      </div>

      {/* Affichage des emplois du temps */}
      {emplois.length === 0 && !showForm && (
        <div style={{
          background: 'white', borderRadius: 16, padding: '48px',
          textAlign: 'center', color: '#94a3b8',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>📅</div>
          <h5>Aucun emploi du temps trouvé</h5>
        </div>
      )}

      {emplois.map(et => (
        <div key={et.id} style={{
          background: 'white', borderRadius: 16, overflow: 'hidden',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: 24
        }}>
          {/* Header */}
          <div style={{
            padding: '16px 24px', display: 'flex',
            justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid #f1f5f9'
          }}>
            <div>
              <strong style={{ fontSize: '1rem', color: '#1e293b' }}>
                {et.classe_libelle}
              </strong>
              <span style={{ color: '#64748b', marginLeft: 12, fontSize: '0.9rem' }}>
                Semaine du {et.semaine_debut}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <span style={{
                background: et.statut_publication === 'publie' ? '#f0fdf4' : '#fffbeb',
                color:      et.statut_publication === 'publie' ? '#10b981' : '#f59e0b',
                padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600,
                border: `1px solid ${et.statut_publication === 'publie' ? '#86efac' : '#fcd34d'}`
              }}>
                {et.statut_publication === 'publie' ? '✅ Publié' : '📝 Brouillon'}
              </span>
              {user?.role === 'administrateur' && (
                <>
                  {et.statut_publication === 'brouillon' && (
                    <button onClick={() => publier(et.id)} style={{
                      background: '#f0fdf4', color: '#10b981',
                      border: '1px solid #86efac', borderRadius: 8,
                      padding: '6px 14px', fontSize: '0.85rem',
                      cursor: 'pointer', fontWeight: 600
                    }}>
                      📢 Publier
                    </button>
                  )}
                  <button onClick={() => supprimerEmploi(et.id)} style={{
                    background: '#fef2f2', color: '#ef4444',
                    border: '1px solid #fecaca', borderRadius: 8,
                    padding: '6px 14px', fontSize: '0.85rem',
                    cursor: 'pointer', fontWeight: 600
                  }}>
                    🗑️ Supprimer
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Grille hebdomadaire */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {JOURS.map(j => (
                    <th key={j} style={{
                      padding: '10px', textAlign: 'center',
                      background: '#f8fafc', fontWeight: 700,
                      color: '#374151', fontSize: '0.85rem',
                      borderBottom: '2px solid #e2e8f0'
                    }}>{j}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  {JOURS.map(jour => (
                    <td key={jour} style={{
                      padding: 8, verticalAlign: 'top',
                      minWidth: 160, borderRight: '1px solid #f1f5f9'
                    }}>
                      {(et.creneaux || []).filter(c => c.jour === jour).map(c => (
                        <div key={c.id} style={{
                          background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                          color: 'white', borderRadius: 10,
                          padding: '8px 10px', marginBottom: 6, fontSize: '0.8rem'
                        }}>
                          <div style={{ fontWeight: 700 }}>{c.matiere}</div>
                          <div style={{ opacity: 0.9 }}>
                            {c.heure_debut?.slice(0,5)} - {c.heure_fin?.slice(0,5)}
                          </div>
                          <div style={{ opacity: 0.8 }}>{c.prenom} {c.nom}</div>
                          <div style={{ opacity: 0.8 }}>🚪 {c.salle}</div>
                          {user?.role === 'administrateur' && (
                            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
                              <button onClick={() => genererQR(c.id)} style={{
                                background: 'rgba(255,255,255,0.2)', color: 'white',
                                border: 'none', borderRadius: 6, padding: '3px 8px',
                                fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600
                              }}>
                                📷 QR
                              </button>
                              <button onClick={() => setCreneauModif({
                                id: c.id, jour: c.jour,
                                heure_debut: c.heure_debut?.slice(0,5),
                                heure_fin: c.heure_fin?.slice(0,5),
                                id_matiere: c.id_matiere,
                                id_enseignant: c.id_enseignant,
                                id_salle: c.id_salle
                              })} style={{
                                background: 'rgba(255,255,255,0.2)', color: 'white',
                                border: 'none', borderRadius: 6, padding: '3px 8px',
                                fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600
                              }}>
                                ✏️
                              </button>
                              <button onClick={() => supprimerCreneau(c.id)} style={{
                                background: 'rgba(239,68,68,0.3)', color: 'white',
                                border: 'none', borderRadius: 6, padding: '3px 8px',
                                fontSize: '0.7rem', cursor: 'pointer', fontWeight: 600
                              }}>
                                🗑️
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}