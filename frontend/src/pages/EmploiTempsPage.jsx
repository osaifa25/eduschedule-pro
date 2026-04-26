import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function EmploiTempsPage() {
  const { user } = useAuth();
  const [emplois, setEmplois]     = useState([]);
  const [classes, setClasses]     = useState([]);
  const [matieres, setMatieres]   = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [salles, setSalles]       = useState([]);
  const [filtreClasse, setFiltreClasse] = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [qrInfo, setQrInfo]       = useState(null);
  const [form, setForm] = useState({
    id_classe: '', semaine_debut: '', creneaux: []
  });
  const [nouveauCreneau, setNouveauCreneau] = useState({
    jour: 'Lundi', heure_debut: '08:00', heure_fin: '10:00',
    id_matiere: '', id_enseignant: '', id_salle: ''
  });

  const charger = () => {
    const params = filtreClasse ? `?id_classe=${filtreClasse}` : '';
    api.get(`/emploi_temps.php${params}`).then(r => setEmplois(r.data.data)).catch(() => {});
  };

  useEffect(() => {
    api.get('/classes.php').then(r => setClasses(r.data.data));
    api.get('/enseignants.php').then(r => setEnseignants(r.data.data));
    api.get('/salles.php').then(r => setSalles(r.data.data));
    api.get('/matieres.php').then(r => setMatieres(r.data.data));
  }, []);

  useEffect(() => { charger(); }, [filtreClasse]);

  const ajouterCreneau = () => {
    if (!nouveauCreneau.id_matiere || !nouveauCreneau.id_enseignant || !nouveauCreneau.id_salle) {
      alert('Remplissez tous les champs du créneau');
      return;
    }
    setForm(f => ({ ...f, creneaux: [...f.creneaux, { ...nouveauCreneau }] }));
    setNouveauCreneau({ jour: 'Lundi', heure_debut: '08:00', heure_fin: '10:00', id_matiere: '', id_enseignant: '', id_salle: '' });
  };

  const supprimerCreneau = (index) => {
    setForm(f => ({ ...f, creneaux: f.creneaux.filter((_, i) => i !== index) }));
  };

  const soumettre = async () => {
    if (!form.id_classe || !form.semaine_debut) {
      alert('Choisissez une classe et une semaine');
      return;
    }
    try {
      await api.post('/emploi_temps.php', form);
      alert('Emploi du temps créé !');
      setShowForm(false);
      setForm({ id_classe: '', semaine_debut: '', creneaux: [] });
      charger();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  const publier = async (id) => {
    await api.put(`/emploi_temps.php?action=publier&id=${id}`);
    charger();
  };

  const genererQR = async (id) => {
    try {
      const res = await api.get(`/qrcode.php?id=${id}`);
      setQrInfo(res.data);
    } catch (err) {
      alert('Erreur génération QR');
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h4 className="mb-0">Emploi du temps</h4>
        {user?.role === 'administrateur' && (
          <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Annuler' : '+ Créer un emploi du temps'}
          </button>
        )}
      </div>

      {/* Modal QR Code */}
      {qrInfo && (
        <div className="modal d-block" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">QR Code généré</h5>
                <button className="btn-close" onClick={() => setQrInfo(null)}></button>
              </div>
              <div className="modal-body text-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrInfo.token)}`}
                  alt="QR Code"
                  className="mb-3"
                />
                <p><strong>Token :</strong> <code>{qrInfo.token}</code></p>
                <p><strong>Expire :</strong> {qrInfo.expire}</p>
                <p className="text-muted small">L'enseignant scanne ce QR pour pointer sa présence</p>
              </div>
              <div className="modal-footer">
                <button className="btn btn-secondary" onClick={() => setQrInfo(null)}>Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Formulaire de création */}
      {showForm && (
        <div className="card shadow mb-4 p-3">
          <h5 className="mb-3">Nouveau planning</h5>
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

          <h6 className="mt-3">Ajouter un créneau</h6>
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
          <button className="btn btn-outline-primary btn-sm mb-3" onClick={ajouterCreneau}>
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
                    <td><button className="btn btn-danger btn-sm" onClick={() => supprimerCreneau(i)}>✕</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <button className="btn btn-success" onClick={soumettre}>
            💾 Enregistrer l'emploi du temps
          </button>
        </div>
      )}

      {/* Filtre */}
      <div className="mb-3">
        <select className="form-select w-auto" value={filtreClasse}
          onChange={e => setFiltreClasse(e.target.value)}>
          <option value="">Toutes les classes</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.libelle}</option>)}
        </select>
      </div>

      {/* Affichage emplois du temps */}
      {emplois.map(et => (
        <div key={et.id} className="card mb-4 shadow-sm">
          <div className="card-header d-flex justify-content-between align-items-center">
            <span><strong>{et.classe_libelle}</strong> — Semaine du {et.semaine_debut}</span>
            <div className="d-flex gap-2 align-items-center">
              <span className={`badge ${et.statut_publication === 'publie' ? 'bg-success' : 'bg-warning'}`}>
                {et.statut_publication}
              </span>
              {user?.role === 'administrateur' && et.statut_publication === 'brouillon' && (
                <button className="btn btn-sm btn-success" onClick={() => publier(et.id)}>
                  Publier
                </button>
              )}
            </div>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-bordered mb-0">
                <thead className="table-light">
                  <tr>{JOURS.map(j => <th key={j} className="text-center">{j}</th>)}</tr>
                </thead>
                <tbody>
                  <tr>
                    {JOURS.map(jour => (
                      <td key={jour} className="p-1" style={{ minWidth: 140, verticalAlign: 'top' }}>
                        {(et.creneaux || []).filter(c => c.jour === jour).map(c => (
                          <div key={c.id} className="bg-primary text-white rounded p-1 mb-1 small">
                            <div className="fw-bold">{c.matiere}</div>
                            <div>{c.heure_debut?.slice(0,5)} - {c.heure_fin?.slice(0,5)}</div>
                            <div className="opacity-75">{c.prenom} {c.nom}</div>
                            <div className="opacity-75">Salle {c.salle}</div>
                            {user?.role === 'administrateur' && (
                              <button className="btn btn-warning btn-sm mt-1 w-100"
                                onClick={() => genererQR(c.id)}>
                                📷 QR
                              </button>
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
        </div>
      ))}

      {emplois.length === 0 && !showForm && (
        <div className="alert alert-info">Aucun emploi du temps trouvé.</div>
      )}
    </div>
  );
}