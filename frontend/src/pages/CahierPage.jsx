import React, { useEffect, useRef, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

export default function CahierPage() {
  const { user } = useAuth();
  const [cahiers, setCahiers]         = useState([]);
  const [creneaux, setCreneaux]       = useState([]);
  const [selectionne, setSelectionne] = useState(null);
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm] = useState({
    id_creneau: '', titre_cours: '', contenu_json: '', travaux: []
  });
  const [nouveauTravail, setNouveauTravail] = useState({
    description: '', date_limite: '', type: 'devoir'
  });
  const canvasRef = useRef(null);
  const sigPad    = useRef(null);

  const charger = () => {
    api.get('/cahiers.php').then(r => setCahiers(r.data.data)).catch(() => {});
  };

  useEffect(() => {
    charger();
    api.get('/emploi_temps.php').then(r => {
      const tousCreneaux = [];
      r.data.data.forEach(et => {
        (et.creneaux || []).forEach(c => tousCreneaux.push(c));
      });
      setCreneaux(tousCreneaux);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (selectionne && canvasRef.current) {
      import('signature_pad').then(({ default: SignaturePad }) => {
        sigPad.current = new SignaturePad(canvasRef.current);
      });
    }
  }, [selectionne]);

  const ajouterTravail = () => {
    if (!nouveauTravail.description) return;
    setForm(f => ({ ...f, travaux: [...f.travaux, { ...nouveauTravail }] }));
    setNouveauTravail({ description: '', date_limite: '', type: 'devoir' });
  };

  const soumettre = async () => {
    if (!form.id_creneau || !form.titre_cours) {
      alert('Choisissez un créneau et un titre');
      return;
    }
    try {
      await api.post('/cahiers.php', {
        id_creneau:   form.id_creneau,
        titre_cours:  form.titre_cours,
        contenu_json: { points: form.contenu_json },
        travaux:      form.travaux
      });
      alert('Cahier créé !');
      setShowForm(false);
      setForm({ id_creneau: '', titre_cours: '', contenu_json: '', travaux: [] });
      charger();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const signer = async (type) => {
    if (!sigPad.current || sigPad.current.isEmpty()) {
      alert('Veuillez apposer votre signature');
      return;
    }
    try {
      const sig = sigPad.current.toDataURL();
      if (type === 'enseignant') {
        await api.post(`/cahiers.php?action=cloture&id=${selectionne.id}`, {
          heure_fin: new Date().toTimeString().slice(0, 8),
          signature_base64: sig
        });
      } else {
        await api.post(`/cahiers.php?action=signer&id=${selectionne.id}`, {
          signature_base64: sig, type
        });
      }
      alert('Signature enregistrée !');
      setSelectionne(null);
      charger();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la signature');
    }
  };

  const telechargerPDF = async (id) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(
        `http://localhost/eduschedule-pro/backend/api/pdf.php?type=cahier&id=${id}&token=${encodeURIComponent(token)}`
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
      a.download = `cahier_${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Erreur lors du téléchargement');
    }
  };

  const statutConfig = {
    brouillon:     { couleur: '#94a3b8', bg: '#f8fafc', label: 'Brouillon',     icon: '📝' },
    signe_delegue: { couleur: '#f59e0b', bg: '#fffbeb', label: 'Signé délégué', icon: '✍️' },
    cloture:       { couleur: '#10b981', bg: '#f0fdf4', label: 'Clôturé',       icon: '✅' }
  };

  return (
    <div style={{ padding: 32 }}>

      {/* En-tête */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h4 style={{ margin: 0, fontWeight: 800, color: '#1e293b' }}>📝 Cahiers de texte</h4>
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
            Suivi pédagogique des séances de cours
          </p>
        </div>
        {user?.role === 'delegue' && (
          <button onClick={() => setShowForm(!showForm)} style={{
            background: 'linear-gradient(135deg, #1a56db, #7e3af2)',
            color: 'white', border: 'none', borderRadius: 10,
            padding: '10px 20px', fontWeight: 600, cursor: 'pointer'
          }}>
            {showForm ? '✕ Annuler' : '+ Nouveau cahier'}
          </button>
        )}
      </div>

      {/* Formulaire création */}
      {showForm && (
        <div style={{
          background: 'white', borderRadius: 16, padding: 24,
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: 24
        }}>
          <h5 style={{ fontWeight: 700, marginBottom: 20 }}>Nouveau cahier de texte</h5>

          <div className="mb-3">
            <label className="form-label">Créneau concerné</label>
            <select className="form-select" value={form.id_creneau}
              onChange={e => setForm(f => ({ ...f, id_creneau: e.target.value }))}>
              <option value="">Choisir un créneau</option>
              {creneaux.map(c => (
                <option key={c.id} value={c.id}>
                  {c.jour} — {c.matiere} — {c.heure_debut?.slice(0,5)}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-3">
            <label className="form-label">Titre du cours</label>
            <input type="text" className="form-control"
              placeholder="Ex: Introduction aux réseaux TCP/IP"
              value={form.titre_cours}
              onChange={e => setForm(f => ({ ...f, titre_cours: e.target.value }))} />
          </div>

          <div className="mb-3">
            <label className="form-label">Points vus dans le cours</label>
            <textarea className="form-control" rows={4}
              placeholder="Décrivez les notions, concepts et exercices abordés..."
              value={form.contenu_json}
              onChange={e => setForm(f => ({ ...f, contenu_json: e.target.value }))} />
          </div>

          <div className="mb-3">
            <label className="form-label fw-bold">Travaux demandés</label>
            <div className="row g-2 mb-2">
              <div className="col-md-5">
                <input type="text" className="form-control form-control-sm"
                  placeholder="Description" value={nouveauTravail.description}
                  onChange={e => setNouveauTravail(t => ({ ...t, description: e.target.value }))} />
              </div>
              <div className="col-md-3">
                <input type="date" className="form-control form-control-sm"
                  value={nouveauTravail.date_limite}
                  onChange={e => setNouveauTravail(t => ({ ...t, date_limite: e.target.value }))} />
              </div>
              <div className="col-md-2">
                <select className="form-select form-select-sm" value={nouveauTravail.type}
                  onChange={e => setNouveauTravail(t => ({ ...t, type: e.target.value }))}>
                  <option value="devoir">Devoir</option>
                  <option value="exercice">Exercice</option>
                  <option value="projet">Projet</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div className="col-md-2">
                <button className="btn btn-outline-primary btn-sm w-100" onClick={ajouterTravail}>
                  + Ajouter
                </button>
              </div>
            </div>
            {form.travaux.length > 0 && (
              <table className="table table-sm table-bordered">
                <thead className="table-light">
                  <tr><th>Description</th><th>Date limite</th><th>Type</th></tr>
                </thead>
                <tbody>
                  {form.travaux.map((t, i) => (
                    <tr key={i}>
                      <td>{t.description}</td>
                      <td>{t.date_limite || '—'}</td>
                      <td>{t.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <button onClick={soumettre} style={{
            background: '#10b981', color: 'white', border: 'none',
            borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer'
          }}>
            💾 Enregistrer le cahier
          </button>
        </div>
      )}

      {/* Liste cahiers */}
      {!selectionne && (
        <div className="row g-3">
          {cahiers.length === 0 && (
            <div style={{
              background: 'white', borderRadius: 16, padding: '48px',
              textAlign: 'center', color: '#94a3b8',
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)'
            }}>
              <div style={{ fontSize: '3rem', marginBottom: 16 }}>📝</div>
              <h5>Aucun cahier de texte</h5>
              <p>Les cahiers apparaîtront ici après les séances</p>
            </div>
          )}
          {cahiers.map(c => {
            const config = statutConfig[c.statut] || statutConfig.brouillon;
            return (
              <div key={c.id} className="col-md-6 col-lg-4">
                <div style={{
                  background: 'white', borderRadius: 16, overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                  borderTop: `4px solid ${config.couleur}`, height: '100%'
                }}>
                  <div style={{ padding: '20px 20px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                      <span style={{
                        background: config.bg, color: config.couleur,
                        padding: '3px 10px', borderRadius: 20,
                        fontSize: '0.75rem', fontWeight: 600,
                        border: `1px solid ${config.couleur}`
                      }}>
                        {config.icon} {config.label}
                      </span>
                    </div>
                    <h6 style={{ fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>
                      {c.matiere} — {c.classe}
                    </h6>
                    <p style={{ color: '#64748b', fontSize: '0.85rem', margin: '4px 0' }}>
                      📅 {c.jour} à {c.heure_debut?.slice(0,5)}
                    </p>
                    <p style={{ color: '#374151', fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>
                      {c.titre_cours || 'Sans titre'}
                    </p>
                  </div>
                  <div style={{
                    padding: '12px 20px', background: '#f8fafc',
                    borderTop: '1px solid #f1f5f9', display: 'flex', gap: 8
                  }}>
                    <button onClick={() => api.get(`/cahiers.php?id=${c.id}`).then(r => setSelectionne(r.data.data))}
                      style={{
                        background: '#eff6ff', color: '#3b82f6',
                        border: '1px solid #bfdbfe', borderRadius: 8,
                        padding: '6px 14px', fontSize: '0.85rem',
                        cursor: 'pointer', fontWeight: 600
                      }}>
                      👁️ Voir
                    </button>
                    <button onClick={() => telechargerPDF(c.id)} style={{
                      background: '#f0fdf4', color: '#10b981',
                      border: '1px solid #86efac', borderRadius: 8,
                      padding: '6px 14px', fontSize: '0.85rem',
                      cursor: 'pointer', fontWeight: 600
                    }}>
                      📄 PDF
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Détail + Signature */}
      {selectionne && (
        <div style={{
          background: 'white', borderRadius: 16, padding: 32,
          boxShadow: '0 2px 10px rgba(0,0,0,0.06)', maxWidth: 700
        }}>
          <button onClick={() => setSelectionne(null)} style={{
            background: '#f1f5f9', border: 'none', borderRadius: 8,
            padding: '8px 16px', cursor: 'pointer', marginBottom: 24,
            fontWeight: 600, color: '#374151'
          }}>
            ← Retour
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 24 }}>
            <h5 style={{ fontWeight: 800, color: '#1e293b', margin: 0 }}>
              {selectionne.matiere} — {selectionne.classe}
            </h5>
            <button onClick={() => telechargerPDF(selectionne.id)} style={{
              background: '#eff6ff', color: '#3b82f6',
              border: '1px solid #bfdbfe', borderRadius: 8,
              padding: '8px 16px', fontSize: '0.85rem',
              cursor: 'pointer', fontWeight: 600
            }}>
              📄 Télécharger PDF
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
            {[
              ['Enseignant', `${selectionne.enseignant_prenom} ${selectionne.enseignant_nom}`],
              ['Jour', selectionne.jour],
              ['Heure début', selectionne.heure_debut?.slice(0,5)],
              ['Heure fin', selectionne.heure_fin_reelle || selectionne.heure_fin?.slice(0,5)],
            ].map(([label, val]) => (
              <div key={label} style={{ background: '#f8fafc', borderRadius: 10, padding: '12px 16px' }}>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: 4 }}>{label}</div>
                <div style={{ fontWeight: 600, color: '#1e293b' }}>{val}</div>
              </div>
            ))}
          </div>

          {selectionne.titre_cours && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: '#374151' }}>📌 Titre du cours</div>
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16 }}>
                {selectionne.titre_cours}
              </div>
            </div>
          )}

          {selectionne.contenu_json && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: '#374151' }}>📋 Points vus</div>
              <div style={{ background: '#f8fafc', borderRadius: 10, padding: 16, lineHeight: 1.6 }}>
                {typeof selectionne.contenu_json === 'string'
                  ? selectionne.contenu_json
                  : selectionne.contenu_json?.points || JSON.stringify(selectionne.contenu_json)}
              </div>
            </div>
          )}

          {selectionne.travaux?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: '#374151' }}>📚 Travaux demandés</div>
              <table className="table table-sm table-bordered">
                <thead className="table-light">
                  <tr><th>Description</th><th>Date limite</th><th>Type</th></tr>
                </thead>
                <tbody>
                  {selectionne.travaux.map(t => (
                    <tr key={t.id}>
                      <td>{t.description}</td>
                      <td>{t.date_limite || '—'}</td>
                      <td>{t.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {selectionne.signatures?.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 700, marginBottom: 8, color: '#374151' }}>✍️ Signatures</div>
              <div style={{ display: 'flex', gap: 16 }}>
                {selectionne.signatures.map(s => (
                  <div key={s.id} style={{ textAlign: 'center' }}>
                    <img src={s.signature_base64} alt="signature" style={{
                      border: '1px solid #e2e8f0', borderRadius: 8,
                      maxWidth: 150, maxHeight: 80
                    }} />
                    <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: 4 }}>
                      {s.type_signataire}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {selectionne.statut !== 'cloture' && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontWeight: 700, marginBottom: 12, color: '#374151' }}>
                ✍️ Apposer votre signature
              </div>
              <canvas ref={canvasRef} width={500} height={150} style={{
                border: '2px solid #e2e8f0', borderRadius: 12,
                display: 'block', cursor: 'crosshair', background: 'white'
              }} />
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={() => sigPad.current?.clear()} style={{
                  background: '#f1f5f9', border: 'none', borderRadius: 8,
                  padding: '8px 16px', cursor: 'pointer', fontWeight: 600
                }}>
                  🗑️ Effacer
                </button>
                {user?.role === 'delegue' && selectionne.statut === 'brouillon' && (
                  <button onClick={() => signer('delegue')} style={{
                    background: '#3b82f6', color: 'white', border: 'none',
                    borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600
                  }}>
                    ✍️ Signer (Délégué)
                  </button>
                )}
                {user?.role === 'enseignant' && (
                  <button onClick={() => signer('enseignant')} style={{
                    background: '#10b981', color: 'white', border: 'none',
                    borderRadius: 8, padding: '8px 20px', cursor: 'pointer', fontWeight: 600
                  }}>
                    ✍️ Signer & Clôturer
                  </button>
                )}
              </div>
            </div>
          )}

          {selectionne.statut === 'cloture' && (
            <div style={{
              background: '#f0fdf4', border: '1px solid #86efac',
              borderRadius: 12, padding: 16, marginTop: 16,
              color: '#10b981', fontWeight: 600
            }}>
              ✅ Cette séance est clôturée et signée par les deux parties.
            </div>
          )}
        </div>
      )}
    </div>
  );
}