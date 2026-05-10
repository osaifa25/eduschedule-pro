/**
 * Page Emploi du Temps — Style institutionnel ISGE
 * EduSchedule Pro — ISGE RST 2025-2026
 */
import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import { QRCodeSVG as QRCode } from 'qrcode.react';
const JOURS_SEMAINE = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const PLAGES = [
  { id: 'matin',      label: '7h30\nà\n9h30',   debut: '07:30', fin: '09:30' },
  { id: 'milieu',     label: '10h\nà\n12h15',    debut: '10:00', fin: '12:15' },
  { id: 'apremidi',   label: '15h\nà\n18h',      debut: '15:00', fin: '18:00' },
];

const toMin = (h) => {
  if (!h) return 0;
  const [hh, mm] = h.slice(0, 5).split(':').map(Number);
  return hh * 60 + mm;
};

const creneauDansPlage = (creneau, plage) => {
  const cDeb = toMin(creneau.heure_debut);
  const cFin = toMin(creneau.heure_fin);
  const pDeb = toMin(plage.debut);
  const pFin = toMin(plage.fin);
  return cDeb < pFin && cFin > pDeb;
};

// Obtenir les dates de la semaine à partir du lundi
const getDatesemaine = (lundiStr) => {
  if (!lundiStr) return JOURS_SEMAINE.map((j, i) => ({ jour: j, date: null, num: '' }));
  const lundi = new Date(lundiStr);
  return JOURS_SEMAINE.map((jour, i) => {
    const d = new Date(lundi);
    d.setDate(lundi.getDate() + i);
    return {
      jour,
      date: d,
      num: d.getDate(),
      mois: d.toLocaleDateString('fr-FR', { month: 'long' }),
    };
  });
};

const formatSemaine = (lundiStr) => {
  if (!lundiStr) return '';
  const lundi = new Date(lundiStr);
  const samedi = new Date(lundi);
  samedi.setDate(lundi.getDate() + 5);
  const opts = { day: '2-digit', month: '2-digit', year: 'numeric' };
  return `du ${lundi.toLocaleDateString('fr-FR', opts)} au ${samedi.toLocaleDateString('fr-FR', opts)}`;
};

export default function EmploiTempsPage() {
  const { user } = useAuth();

  const [emplois,      setEmplois]      = useState([]);
  const [classes,      setClasses]      = useState([]);
  const [matieres,     setMatieres]     = useState([]);
  const [enseignants,  setEnseignants]  = useState([]);
  const [salles,       setSalles]       = useState([]);
  const [filtreClasse, setFiltreClasse] = useState('');
  const [showForm,     setShowForm]     = useState(false);
  const [conflits,     setConflits]     = useState([]);
  const [creneauModif, setCreneauModif] = useState(null);
  const [qrInfo,       setQrInfo]       = useState(null);
  const [emploiActif,  setEmploiActif]  = useState(null);

  const [form, setForm] = useState({
    id_classe: '', semaine_debut: '', creneaux: []
  });

  const [nouveauCreneau, setNouveauCreneau] = useState({
    jour: 'Lundi', heure_debut: '07:30', heure_fin: '09:30',
    id_matiere: '', id_enseignant: '', id_salle: ''
  });

  const charger = () => {
    const params = filtreClasse ? `?id_classe=${filtreClasse}` : '';
    api.get(`/emploi_temps.php${params}`)
      .then(r => {
        setEmplois(r.data.data);
        if (r.data.data.length > 0) setEmploiActif(r.data.data[0].id);
      })
      .catch(() => {});
  };

  useEffect(() => {
    api.get('/classes.php').then(r     => setClasses(r.data.data));
    api.get('/enseignants.php').then(r => setEnseignants(r.data.data));
    api.get('/salles.php').then(r      => setSalles(r.data.data));
    api.get('/matieres.php').then(r    => setMatieres(r.data.data));
  }, []);

  useEffect(() => { charger(); }, [filtreClasse]);

  const ajouterCreneau = () => {
    if (!nouveauCreneau.id_matiere || !nouveauCreneau.id_enseignant || !nouveauCreneau.id_salle) {
      alert('Remplissez tous les champs'); return;
    }
    setForm(f => ({ ...f, creneaux: [...f.creneaux, { ...nouveauCreneau }] }));
    setNouveauCreneau({ jour: 'Lundi', heure_debut: '07:30', heure_fin: '09:30', id_matiere: '', id_enseignant: '', id_salle: '' });
  };

  const supprimerCreneauForm = (i) => setForm(f => ({ ...f, creneaux: f.creneaux.filter((_, idx) => idx !== i) }));

  const soumettre = async () => {
    if (!form.id_classe || !form.semaine_debut) { alert('Choisissez une classe et une semaine'); return; }
    try {
      const res = await api.post('/emploi_temps.php', form);
      if (res.data.conflits?.length > 0) setConflits(res.data.conflits); else setConflits([]);
      alert(res.data.message);
      setShowForm(false);
      setForm({ id_classe: '', semaine_debut: '', creneaux: [] });
      charger();
    } catch (err) { alert(err.response?.data?.message || 'Erreur'); }
  };

  const publier        = async (id) => { await api.put(`/emploi_temps.php?action=publier&id=${id}`); charger(); };
  const supprimerEmploi = async (id) => {
    if (!window.confirm('Supprimer cet emploi du temps ?')) return;
    await api.delete(`/emploi_temps.php?id=${id}`);
    setEmploiActif(null); charger();
  };
  const genererQR      = async (id) => {
    try { const r = await api.get(`/qrcode.php?id=${id}`); setQrInfo(r.data); }
    catch { alert('Erreur QR'); }
  };
  const supprimerCreneau = async (id) => {
    if (!window.confirm('Supprimer ce créneau ?')) return;
    await api.delete(`/creneaux.php?id=${id}`); charger();
  };
  const modifierCreneau = async () => {
    try { await api.put(`/creneaux.php?id=${creneauModif.id}`, creneauModif); setCreneauModif(null); charger(); }
    catch (err) { alert(err.response?.data?.message || 'Erreur'); }
  };

  const emploiSelectionne = emplois.find(e => e.id === emploiActif);
  const datesSemaine = getDatesemaine(emploiSelectionne?.semaine_debut);

  // Récupérer les travaux demandés de tous les cahiers de texte
  const [travaux, setTravaux] = useState([]);
  useEffect(() => {
    if (!emploiSelectionne) return;
    api.get('/cahiers.php').then(r => {
      const tous = r.data.data || [];
      const tw = [];
      tous.forEach(c => {
        if (c.travaux_demandes) {
          c.travaux_demandes.forEach(t => tw.push({ ...t, matiere: c.matiere, date_seance: c.date }));
        }
      });
      setTravaux(tw);
    }).catch(() => {});
  }, [emploiActif]);

  // Style commun cellule cours
  const cellStyle = {
    border: '1px solid #ccc',
    padding: '6px 8px',
    verticalAlign: 'top',
    fontSize: '0.75rem',
    background: 'white',
  };

  const thStyle = {
    border: '1px solid #ccc',
    padding: '8px',
    background: '#f5f5f5',
    fontWeight: 700,
    fontSize: '0.8rem',
    textAlign: 'center',
  };

  return (
    <div style={{ padding: '24px 32px', background: '#f0f0f0', minHeight: '100vh', fontFamily: 'Georgia, serif' }}>

      {/* ===== MODAL QR ===== */}
      {qrInfo && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, textAlign: 'center', maxWidth: 360 }}>
            <h5 style={{ fontWeight: 700, marginBottom: 12 }}>📷 QR Code de la séance</h5>
    <QRCode 
  value={qrInfo.qr_url || qrInfo.token} 
  size={200} 
  style={{ marginBottom: 12 }}
/>
          <p style={{ fontSize: '0.75rem', color: '#64748b', wordBreak: 'break-all' }}>{qrInfo.token}</p>
            <p style={{ fontWeight: 600, fontSize: '0.85rem' }}>Expire : {qrInfo.expire}</p>
            <button onClick={() => setQrInfo(null)} style={{ background: '#1e293b', color: 'white', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 600, cursor: 'pointer', width: '100%' }}>Fermer</button>
          </div>
        </div>
      )}

      {/* ===== MODAL MODIFICATION ===== */}
      {creneauModif && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, width: '90%', maxWidth: 500 }}>
            <h5 style={{ fontWeight: 700, marginBottom: 20 }}>✏️ Modifier le créneau</h5>
            <div className="row g-3">
              <div className="col-6">
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Jour</label>
                <select className="form-select" value={creneauModif.jour} onChange={e => setCreneauModif(c => ({ ...c, jour: e.target.value }))}>
                  {JOURS_SEMAINE.map(j => <option key={j}>{j}</option>)}
                </select>
              </div>
              <div className="col-3">
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Début</label>
                <input type="time" className="form-control" value={creneauModif.heure_debut} onChange={e => setCreneauModif(c => ({ ...c, heure_debut: e.target.value }))} />
              </div>
              <div className="col-3">
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Fin</label>
                <input type="time" className="form-control" value={creneauModif.heure_fin} onChange={e => setCreneauModif(c => ({ ...c, heure_fin: e.target.value }))} />
              </div>
              <div className="col-12">
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Matière</label>
                <select className="form-select" value={creneauModif.id_matiere} onChange={e => setCreneauModif(c => ({ ...c, id_matiere: e.target.value }))}>
                  {matieres.map(m => <option key={m.id} value={m.id}>{m.libelle}</option>)}
                </select>
              </div>
              <div className="col-6">
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Enseignant</label>
                <select className="form-select" value={creneauModif.id_enseignant} onChange={e => setCreneauModif(c => ({ ...c, id_enseignant: e.target.value }))}>
                  {enseignants.map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
                </select>
              </div>
              <div className="col-6">
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Salle</label>
                <select className="form-select" value={creneauModif.id_salle} onChange={e => setCreneauModif(c => ({ ...c, id_salle: e.target.value }))}>
                  {salles.map(s => <option key={s.id} value={s.id}>{s.code}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 20, justifyContent: 'flex-end' }}>
              <button onClick={() => setCreneauModif(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
              <button onClick={modifierCreneau} style={{ background: '#1a56db', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}>💾 Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== FORMULAIRE CRÉATION ===== */}
      {showForm && (
        <div style={{ background: 'white', borderRadius: 12, padding: 24, marginBottom: 24, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', fontFamily: 'Segoe UI, sans-serif' }}>
          <h5 style={{ fontWeight: 700, marginBottom: 20, color: '#0f172a' }}>Nouveau planning hebdomadaire</h5>
          <div className="row g-3 mb-3">
            <div className="col-md-6">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Classe</label>
              <select className="form-select" value={form.id_classe} onChange={e => setForm(f => ({ ...f, id_classe: e.target.value }))}>
                <option value="">Choisir une classe</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.libelle}</option>)}
              </select>
            </div>
            <div className="col-md-6">
              <label className="form-label" style={{ fontWeight: 600, fontSize: '0.85rem' }}>Semaine du (lundi)</label>
              <input type="date" className="form-control" value={form.semaine_debut} onChange={e => setForm(f => ({ ...f, semaine_debut: e.target.value }))} />
            </div>
          </div>

          <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, marginBottom: 16, border: '1px solid #e2e8f0' }}>
            <h6 style={{ fontWeight: 700, marginBottom: 12, fontSize: '0.9rem' }}>➕ Ajouter un créneau</h6>
            <div className="row g-2 mb-2">
              <div className="col-md-2">
                <select className="form-select form-select-sm" value={nouveauCreneau.jour} onChange={e => setNouveauCreneau(n => ({ ...n, jour: e.target.value }))}>
                  {JOURS_SEMAINE.map(j => <option key={j}>{j}</option>)}
                </select>
              </div>
              <div className="col-md-2">
                <input type="time" className="form-control form-control-sm" value={nouveauCreneau.heure_debut} onChange={e => setNouveauCreneau(n => ({ ...n, heure_debut: e.target.value }))} />
              </div>
              <div className="col-md-2">
                <input type="time" className="form-control form-control-sm" value={nouveauCreneau.heure_fin} onChange={e => setNouveauCreneau(n => ({ ...n, heure_fin: e.target.value }))} />
              </div>
              <div className="col-md-2">
                <select className="form-select form-select-sm" value={nouveauCreneau.id_matiere} onChange={e => setNouveauCreneau(n => ({ ...n, id_matiere: e.target.value }))}>
                  <option value="">Matière</option>
                  {matieres.map(m => <option key={m.id} value={m.id}>{m.libelle}</option>)}
                </select>
              </div>
              <div className="col-md-2">
                <select className="form-select form-select-sm" value={nouveauCreneau.id_enseignant} onChange={e => setNouveauCreneau(n => ({ ...n, id_enseignant: e.target.value }))}>
                  <option value="">Enseignant</option>
                  {enseignants.map(e => <option key={e.id} value={e.id}>{e.prenom} {e.nom}</option>)}
                </select>
              </div>
              <div className="col-md-2">
                <select className="form-select form-select-sm" value={nouveauCreneau.id_salle} onChange={e => setNouveauCreneau(n => ({ ...n, id_salle: e.target.value }))}>
                  <option value="">Salle</option>
                  {salles.map(s => <option key={s.id} value={s.id}>{s.code}</option>)}
                </select>
              </div>
            </div>
            <button onClick={ajouterCreneau} style={{ background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', borderRadius: 8, padding: '6px 16px', fontWeight: 600, cursor: 'pointer', fontSize: '0.85rem' }}>
              + Ajouter
            </button>
          </div>

          {form.creneaux.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              {form.creneaux.map((c, i) => {
                const mat = matieres.find(m => m.id == c.id_matiere);
                const ens = enseignants.find(e => e.id == c.id_enseignant);
                const sal = salles.find(s => s.id == c.id_salle);
                return (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#f8fafc', borderRadius: 8, padding: '8px 14px', marginBottom: 6, border: '1px solid #e2e8f0', fontSize: '0.82rem' }}>
                    <span style={{ fontWeight: 700, color: '#1a56db', minWidth: 70 }}>{c.jour}</span>
                    <span style={{ color: '#475569', minWidth: 120 }}>⏰ {c.heure_debut} – {c.heure_fin}</span>
                    <span style={{ color: '#374151', flex: 1 }}>📚 {mat?.libelle} • 👤 {ens?.prenom} {ens?.nom} • 🚪 {sal?.code}</span>
                    <button onClick={() => supprimerCreneauForm(i)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}>✕</button>
                  </div>
                );
              })}
            </div>
          )}

          {conflits.length > 0 && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: 12, marginBottom: 16 }}>
              {conflits.map((c, i) => <div key={i} style={{ color: '#dc2626', fontSize: '0.82rem' }}>⚠️ {c}</div>)}
            </div>
          )}

          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={soumettre} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 700, cursor: 'pointer' }}>💾 Enregistrer</button>
            <button onClick={() => setShowForm(false)} style={{ background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 600, cursor: 'pointer' }}>Annuler</button>
          </div>
        </div>
      )}

      {/* ===== CONTRÔLES ===== */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap', fontFamily: 'Segoe UI, sans-serif' }}>
        <select className="form-select" style={{ width: 'auto', minWidth: 200 }} value={filtreClasse} onChange={e => setFiltreClasse(e.target.value)}>
          <option value="">Toutes les classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.libelle}</option>)}
        </select>
        {emplois.length > 1 && (
          <select className="form-select" style={{ width: 'auto', minWidth: 220 }} value={emploiActif || ''} onChange={e => setEmploiActif(Number(e.target.value))}>
            {emplois.map(e => <option key={e.id} value={e.id}>{e.classe_libelle} — sem. {e.semaine_debut}</option>)}
          </select>
        )}
        {user?.role === 'administrateur' && (
          <button onClick={() => setShowForm(!showForm)} style={{ marginLeft: 'auto', background: showForm ? '#fef2f2' : '#1a56db', color: showForm ? '#ef4444' : 'white', border: showForm ? '1px solid #fecaca' : 'none', borderRadius: 10, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
            {showForm ? '✕ Annuler' : '+ Nouveau planning'}
          </button>
        )}
      </div>

      {/* ===== ÉTAT VIDE ===== */}
      {emplois.length === 0 && !showForm && (
        <div style={{ background: 'white', borderRadius: 12, padding: '64px 32px', textAlign: 'center', fontFamily: 'Segoe UI, sans-serif' }}>
          <div style={{ fontSize: '3rem', marginBottom: 12 }}>📅</div>
          <h5 style={{ color: '#374151' }}>Aucun emploi du temps trouvé</h5>
          {user?.role === 'administrateur' && (
            <button onClick={() => setShowForm(true)} style={{ background: '#1a56db', color: 'white', border: 'none', borderRadius: 10, padding: '10px 24px', fontWeight: 700, cursor: 'pointer', marginTop: 12 }}>
              + Créer un emploi du temps
            </button>
          )}
        </div>
      )}

      {/* ===== EMPLOI DU TEMPS STYLE INSTITUTIONNEL ===== */}
      {emploiSelectionne && (
        <div style={{ background: 'white', borderRadius: 4, padding: '32px 40px', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', maxWidth: 1100, margin: '0 auto' }}>

          {/* Titre cursif */}
          <div style={{ textAlign: 'center', marginBottom: 8 }}>
            <span style={{ fontFamily: 'Brush Script MT, cursive', fontSize: '2.2rem', color: '#222' }}>
              Emploi du temps
            </span>
          </div>

          {/* En-tête : titre semaine + établissement */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', fontFamily: 'Segoe UI, sans-serif', letterSpacing: 1, color: '#111' }}>
                EMPLOI DU TEMPS {formatSemaine(emploiSelectionne.semaine_debut).toUpperCase()}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#555', fontFamily: 'Segoe UI, sans-serif', marginTop: 2 }}>
                {emploiSelectionne.classe_libelle}
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{ fontWeight: 900, fontSize: '1.4rem', color: '#1a56db', fontFamily: 'Arial Black, sans-serif', letterSpacing: 1 }}>
                ISGE
              </span>
              <div style={{ display: 'flex', gap: 8, marginTop: 6, justifyContent: 'flex-end' }}>
                {user?.role === 'administrateur' && (
                  <>
                    <span style={{ background: emploiSelectionne.statut_publication === 'publie' ? '#f0fdf4' : '#fffbeb', color: emploiSelectionne.statut_publication === 'publie' ? '#16a34a' : '#d97706', border: `1px solid ${emploiSelectionne.statut_publication === 'publie' ? '#86efac' : '#fcd34d'}`, borderRadius: 20, padding: '2px 10px', fontSize: '0.72rem', fontWeight: 700, fontFamily: 'Segoe UI, sans-serif' }}>
                      {emploiSelectionne.statut_publication === 'publie' ? '✅ Publié' : '📝 Brouillon'}
                    </span>
                    {emploiSelectionne.statut_publication === 'brouillon' && (
                      <button onClick={() => publier(emploiSelectionne.id)} style={{ background: '#f0fdf4', color: '#16a34a', border: '1px solid #86efac', borderRadius: 8, padding: '4px 12px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, fontFamily: 'Segoe UI, sans-serif' }}>📢 Publier</button>
                    )}
                    <button onClick={() => supprimerEmploi(emploiSelectionne.id)} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 8, padding: '4px 12px', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 600, fontFamily: 'Segoe UI, sans-serif' }}>🗑️ Supprimer</button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ===== TABLEAU PRINCIPAL ===== */}
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
              <colgroup>
                <col style={{ width: '7%' }} />
                {JOURS_SEMAINE.map((_, i) => <col key={i} style={{ width: `${93 / 6}%` }} />)}
              </colgroup>
              <thead>
                <tr>
                  <th style={{ ...thStyle, fontSize: '0.75rem', color: '#555' }}>Horaire</th>
                  {datesSemaine.map(({ jour, num, mois }) => (
                    <th key={jour} style={{ ...thStyle, fontFamily: 'Segoe UI, sans-serif' }}>
                      <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>{jour} {num}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PLAGES.map(plage => (
                  <tr key={plage.id}>
                    {/* Colonne horaire */}
                    <td style={{ ...cellStyle, textAlign: 'center', fontWeight: 700, fontSize: '0.78rem', background: '#f9f9f9', whiteSpace: 'pre-line', lineHeight: 1.8, color: '#333', fontFamily: 'Segoe UI, sans-serif' }}>
                      {plage.label}
                    </td>

                    {/* Colonnes jours */}
                    {JOURS_SEMAINE.map(jour => {
                      const creneaux = (emploiSelectionne.creneaux || []).filter(c => c.jour === jour && creneauDansPlage(c, plage));
                      return (
                        <td key={jour} style={{ ...cellStyle, minHeight: 80, height: 90 }}>
                          {creneaux.length === 0 ? null : creneaux.map(c => (
                            <div key={c.id} style={{ marginBottom: creneaux.length > 1 ? 6 : 0 }}>
                              {/* Horaires */}
                              <div style={{ fontSize: '0.72rem', color: '#555', marginBottom: 2, fontFamily: 'Segoe UI, sans-serif' }}>
                                [{c.heure_debut?.slice(0, 5)} : {c.heure_fin?.slice(0, 5)}]
                              </div>
                              {/* Matière */}
                              <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#111', lineHeight: 1.3, fontFamily: 'Segoe UI, sans-serif' }}>
                                {c.matiere}
                              </div>
                              {/* Enseignant */}
                              <div style={{ fontSize: '0.72rem', color: '#444', marginTop: 3, fontFamily: 'Segoe UI, sans-serif' }}>
                                M. {c.nom} {c.prenom?.charAt(0)}.
                              </div>
                              {/* Salle */}
                              <div style={{ fontSize: '0.7rem', color: '#777', fontStyle: 'italic', marginTop: 2, fontFamily: 'Segoe UI, sans-serif' }}>
                                {c.salle}
                              </div>
                              {/* Boutons admin */}
                              {user?.role === 'administrateur' && (
                                <div style={{ display: 'flex', gap: 3, marginTop: 5 }}>
                                  <button onClick={() => genererQR(c.id)} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 4, padding: '2px 6px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 600 }}>📷 QR</button>
                                  <button onClick={() => setCreneauModif({ id: c.id, jour: c.jour, heure_debut: c.heure_debut?.slice(0, 5), heure_fin: c.heure_fin?.slice(0, 5), id_matiere: c.id_matiere, id_enseignant: c.id_enseignant, id_salle: c.id_salle })} style={{ background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', borderRadius: 4, padding: '2px 6px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 600 }}>✏️</button>
                                  <button onClick={() => supprimerCreneau(c.id)} style={{ background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 4, padding: '2px 6px', fontSize: '0.65rem', cursor: 'pointer', fontWeight: 600 }}>🗑️</button>
                                </div>
                              )}
                            </div>
                          ))}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* ===== TABLEAU DEVOIRS ===== */}
          {travaux.length > 0 && (
            <div style={{ marginTop: 24, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', fontFamily: 'Segoe UI, sans-serif' }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, fontSize: '0.75rem', background: '#e8e8e8' }}>Devoir prévu</th>
                      <th style={{ ...thStyle, fontSize: '0.75rem', background: '#e8e8e8' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {travaux.slice(0, Math.ceil(travaux.length / 2)).map((t, i) => (
                      <tr key={i}>
                        <td style={{ ...cellStyle, fontSize: '0.72rem' }}>{t.description}</td>
                        <td style={{ ...cellStyle, fontSize: '0.72rem', textAlign: 'center', whiteSpace: 'nowrap' }}>{t.date_limite || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem', fontFamily: 'Segoe UI, sans-serif' }}>
                  <thead>
                    <tr>
                      <th style={{ ...thStyle, fontSize: '0.75rem', background: '#e8e8e8' }}>Devoir prévu</th>
                      <th style={{ ...thStyle, fontSize: '0.75rem', background: '#e8e8e8' }}>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {travaux.slice(Math.ceil(travaux.length / 2)).map((t, i) => (
                      <tr key={i}>
                        <td style={{ ...cellStyle, fontSize: '0.72rem' }}>{t.description}</td>
                        <td style={{ ...cellStyle, fontSize: '0.72rem', textAlign: 'center', whiteSpace: 'nowrap' }}>{t.date_limite || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Pied de page institutionnel */}
          <div style={{ marginTop: 28, borderTop: '1px solid #ddd', paddingTop: 12, textAlign: 'center', fontSize: '0.75rem', color: '#777', fontFamily: 'Segoe UI, sans-serif' }}>
            ISGE-BF | Institut Supérieur de Génie Électrique du Burkina Faso
          </div>
        </div>
      )}
    </div>
  );
}