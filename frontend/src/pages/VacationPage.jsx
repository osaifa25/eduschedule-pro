import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function VacationPage() {
  const { user } = useAuth();
  const [vacations, setVacations]     = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [mois, setMois]   = useState(new Date().getMonth() + 1);
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    id_enseignant: '',
    mois:  new Date().getMonth() + 1,
    annee: new Date().getFullYear()
  });

  const moisNoms = ['Janvier','Février','Mars','Avril','Mai','Juin',
                    'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

  const charger = () => {
    api.get(`/vacations.php?mois=${mois}&annee=${annee}`)
      .then(r => setVacations(r.data.data))
      .catch(() => {});
  };

  useEffect(() => {
    charger();
    if (['administrateur','surveillant'].includes(user?.role)) {
      api.get('/enseignants.php').then(r => setEnseignants(r.data.data)).catch(() => {});
    }
  }, [mois, annee]);

  const generer = async () => {
    if (!form.id_enseignant) { alert('Choisissez un enseignant'); return; }
    try {
      const res = await api.post('/vacations.php?action=generer', form);
      alert(`Fiche générée ! Montant brut : ${parseFloat(res.data.montant_brut).toLocaleString()} FCFA`);
      setShowForm(false);
      charger();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la génération');
    }
  };

  const valider = async (id, action) => {
    try {
      await api.post(`/vacations.php?action=${action}&id=${id}`, { commentaire: '' });
      alert(action === 'valider' ? 'Vacation visée !' : 'Vacation approuvée !');
      charger();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur');
    }
  };

  const telechargerPDF = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(
        `http://localhost/eduschedule-pro/backend/api/pdf.php?type=vacation&id=${id}&token=${encodeURIComponent(token)}`
      );
      if (!response.ok) {
        const err = await response.json();
        alert(err.message || 'Erreur PDF');
        return;
      }
      const blob = await response.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `fiche_vacation_${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Erreur lors du téléchargement');
    }
  };

  const statutConfig = {
    generee:           { couleur: '#94a3b8', bg: '#f8fafc', label: 'Générée',           icon: '📄' },
    signee_enseignant: { couleur: '#3b82f6', bg: '#eff6ff', label: 'Signée enseignant', icon: '✍️' },
    visee_surveillant: { couleur: '#f59e0b', bg: '#fffbeb', label: 'Visée surveillant', icon: '👮' },
    approuvee:         { couleur: '#10b981', bg: '#f0fdf4', label: 'Approuvée',         icon: '✅' }
  };

  return (
    <div style={{ padding: 32 }}>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h4 style={{ margin: 0, fontWeight: 800, color: '#1e293b' }}>💰 Fiches de Vacation</h4>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
            Gestion et validation des paiements enseignants
          </p>
        </div>
        {['administrateur','surveillant'].includes(user?.role) && (
          <button onClick={() => setShowForm(!showForm)} style={{
            background: 'linear-gradient(135deg, #1a56db, #7e3af2)',
            color: 'white', border: 'none', borderRadius: 10,
            padding: '10px 20px', fontWeight: 600, cursor: 'pointer'
          }}>
            {showForm ? '✕ Annuler' : '+ Générer une fiche'}
          </button>
        )}
      </div>

      {/* Formulaire génération */}
      {showForm && (
        <div style={{
          background: 'white', borderRadius: 16, padding: 24,
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: 24
        }}>
          <h5 style={{ fontWeight: 700, marginBottom: 20 }}>Générer une fiche de vacation</h5>
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label">Enseignant</label>
              <select className="form-select" value={form.id_enseignant}
                onChange={e => setForm(f => ({ ...f, id_enseignant: e.target.value }))}>
                <option value="">Choisir un enseignant</option>
                {enseignants.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.prenom} {e.nom} — {e.statut}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Mois</label>
              <select className="form-select" value={form.mois}
                onChange={e => setForm(f => ({ ...f, mois: e.target.value }))}>
                {moisNoms.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <label className="form-label">Année</label>
              <input type="number" className="form-control" value={form.annee}
                onChange={e => setForm(f => ({ ...f, annee: e.target.value }))} />
            </div>
            <div className="col-md-2 d-flex align-items-end">
              <button onClick={generer} style={{
                width: '100%', background: '#10b981', color: 'white',
                border: 'none', borderRadius: 8, padding: '10px',
                fontWeight: 600, cursor: 'pointer'
              }}>
                ✓ Générer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtre */}
      <div style={{
        background: 'white', borderRadius: 16, padding: '20px 24px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: 24
      }}>
        <div className="row g-3 align-items-end">
          <div className="col-md-4">
            <label className="form-label">Mois</label>
            <select className="form-select" value={mois}
              onChange={e => setMois(e.target.value)}>
              {moisNoms.map((m, i) => <option key={i+1} value={i+1}>{m}</option>)}
            </select>
          </div>
          <div className="col-md-3">
            <label className="form-label">Année</label>
            <input type="number" className="form-control" value={annee}
              onChange={e => setAnnee(e.target.value)} />
          </div>
          <div className="col-md-2">
            <button onClick={charger} style={{
              width: '100%', background: '#f1f5f9',
              border: '1px solid #e2e8f0', borderRadius: 8,
              padding: '10px', cursor: 'pointer', fontWeight: 600
            }}>
              🔍 Filtrer
            </button>
          </div>
        </div>
      </div>

      {/* Liste vacations */}
      {vacations.length === 0 && (
        <div style={{
          background: 'white', borderRadius: 16, padding: '48px',
          textAlign: 'center', color: '#94a3b8',
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: 16 }}>💰</div>
          <h5>Aucune fiche de vacation</h5>
          <p>pour {moisNoms[mois-1]} {annee}</p>
        </div>
      )}

      <div className="row g-3">
        {vacations.map(v => {
          const config = statutConfig[v.statut] || statutConfig.generee;
          return (
            <div key={v.id} className="col-md-6">
              <div style={{
                background: 'white', borderRadius: 16, overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                borderLeft: `4px solid ${config.couleur}`
              }}>
                <div style={{ padding: '20px 24px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                    <div>
                      <h6 style={{ fontWeight: 700, margin: 0, color: '#1e293b' }}>
                        {v.prenom} {v.nom}
                      </h6>
                      <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>
                        {moisNoms[v.mois-1]} {v.annee}
                      </p>
                    </div>
                    <span style={{
                      background: config.bg, color: config.couleur,
                      padding: '4px 12px', borderRadius: 20,
                      fontSize: '0.8rem', fontWeight: 600,
                      border: `1px solid ${config.couleur}`,
                      height: 'fit-content'
                    }}>
                      {config.icon} {config.label}
                    </span>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#3b82f6' }}>
                        {parseFloat(v.montant_brut).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Montant brut (FCFA)</div>
                    </div>
                    <div style={{ background: '#f0fdf4', borderRadius: 10, padding: '12px 16px', textAlign: 'center' }}>
                      <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#10b981' }}>
                        {parseFloat(v.montant_net).toLocaleString()}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Montant net (FCFA)</div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <button onClick={() => telechargerPDF(v.id)} style={{
                      background: '#eff6ff', color: '#3b82f6',
                      border: '1px solid #bfdbfe', borderRadius: 8,
                      padding: '6px 14px', fontSize: '0.85rem',
                      cursor: 'pointer', fontWeight: 600
                    }}>
                      📄 PDF
                    </button>
                    {['administrateur','surveillant'].includes(user?.role) && v.statut === 'generee' && (
                      <button onClick={() => valider(v.id, 'valider')} style={{
                        background: '#fffbeb', color: '#f59e0b',
                        border: '1px solid #fcd34d', borderRadius: 8,
                        padding: '6px 14px', fontSize: '0.85rem',
                        cursor: 'pointer', fontWeight: 600
                      }}>
                        👮 Viser
                      </button>
                    )}
                    {user?.role === 'comptable' && v.statut === 'visee_surveillant' && (
                      <button onClick={() => valider(v.id, 'approuver')} style={{
                        background: '#f0fdf4', color: '#10b981',
                        border: '1px solid #86efac', borderRadius: 8,
                        padding: '6px 14px', fontSize: '0.85rem',
                        cursor: 'pointer', fontWeight: 600
                      }}>
                        ✅ Approuver
                      </button>
                    )}
                  </div>
                </div>

                <div style={{
                  padding: '10px 24px', background: '#f8fafc',
                  borderTop: '1px solid #f1f5f9',
                  fontSize: '0.75rem', color: '#94a3b8'
                }}>
                  Générée le {new Date(v.date_generation).toLocaleDateString('fr-FR')}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}