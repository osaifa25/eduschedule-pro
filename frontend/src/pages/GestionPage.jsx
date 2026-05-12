/**
 * Page de gestion des référentiels
 * Permet de gérer classes, matières, salles et enseignants
 * EduSchedule Pro — ISGE RST 2025-2026
 */
import React, { useEffect, useState } from 'react';
import api from '../utils/api';

export default function GestionPage() {
  const [onglet, setOnglet] = useState('classes');
  const [classes,     setClasses]     = useState([]);
  const [matieres,    setMatieres]    = useState([]);
  const [salles,      setSalles]      = useState([]);
  const [enseignants, setEnseignants] = useState([]);
  const [sessions,    setSessions]    = useState([]);
  const [enModification, setEnModification] = useState(null);

  const [formClasse,     setFormClasse]     = useState({ code: '', libelle: '', niveau: '', annee_academique: '2025-2026' });
  const [formMatiere,    setFormMatiere]    = useState({ code: '', libelle: '', volume_horaire_total: 0, coefficient: 1 });
  const [formSalle,      setFormSalle]      = useState({ code: '', capacite: 30, equipements: '', batiment: '' });
  const [formEnseignant, setFormEnseignant] = useState({ matricule: '', nom: '', prenom: '', email: '', specialite: '', statut: 'vacataire', taux_horaire: 0, password: 'password' });

  useEffect(() => { chargerTout(); }, []);

  const chargerTout = () => {
    api.get('/classes.php').then(r     => setClasses(r.data.data)).catch(() => {});
    api.get('/matieres.php').then(r    => setMatieres(r.data.data)).catch(() => {});
    api.get('/salles.php').then(r      => setSalles(r.data.data)).catch(() => {});
    api.get('/enseignants.php').then(r => setEnseignants(r.data.data)).catch(() => {});
    api.get('/sessions.php').then(r    => setSessions(r.data.data)).catch(() => {});
  };

  // ---- Créations ----
  const creerClasse = async () => {
    if (!formClasse.code || !formClasse.libelle || !formClasse.niveau) { alert('Remplissez tous les champs'); return; }
    await api.post('/classes.php', formClasse);
    setFormClasse({ code: '', libelle: '', niveau: '', annee_academique: '2025-2026' });
    api.get('/classes.php').then(r => setClasses(r.data.data));
  };

  const creerMatiere = async () => {
    if (!formMatiere.code || !formMatiere.libelle) { alert('Remplissez tous les champs'); return; }
    await api.post('/matieres.php', formMatiere);
    setFormMatiere({ code: '', libelle: '', volume_horaire_total: 0, coefficient: 1 });
    api.get('/matieres.php').then(r => setMatieres(r.data.data));
  };

  const creerSalle = async () => {
    if (!formSalle.code) { alert('Remplissez le code'); return; }
    await api.post('/salles.php', formSalle);
    setFormSalle({ code: '', capacite: 30, equipements: '', batiment: '' });
    api.get('/salles.php').then(r => setSalles(r.data.data));
  };

  const creerEnseignant = async () => {
    if (!formEnseignant.nom || !formEnseignant.email || !formEnseignant.matricule) {
      alert('Remplissez tous les champs obligatoires'); return;
    }
    try {
      const res = await api.post('/enseignants.php', formEnseignant);
      alert(`✅ Enseignant créé !\n\nEmail : ${res.data.email}\nMot de passe : ${res.data.password}\n\nCommuniquez ces infos à l'enseignant.`);
      setFormEnseignant({ matricule: '', nom: '', prenom: '', email: '', specialite: '', statut: 'vacataire', taux_horaire: 0, password: 'password' });
      api.get('/enseignants.php').then(r => setEnseignants(r.data.data));
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la création');
    }
  };

  // ---- Modification ----
  const modifier = async () => {
    if (!enModification) return;
    const { type, data } = enModification;
    const routes = {
      classe:     `/classes.php?id=${data.id}`,
      matiere:    `/matieres.php?id=${data.id}`,
      salle:      `/salles.php?id=${data.id}`,
      enseignant: `/enseignants.php?id=${data.id}`
    };
    try {
      await api.put(routes[type], data);
      alert('Modification enregistrée !');
      setEnModification(null);
      chargerTout();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la modification');
    }
  };

  // ---- Suppression ----
  const supprimer = async (type, id) => {
    if (!window.confirm('Confirmer la suppression ?')) return;
    const routes = {
      classe:     `/classes.php?id=${id}`,
      matiere:    `/matieres.php?id=${id}`,
      salle:      `/salles.php?id=${id}`,
      enseignant: `/enseignants.php?id=${id}`
    };
    try {
      await api.delete(routes[type]);
      chargerTout();
    } catch (err) {
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    }
  };

  const btnModifier  = { background: '#eff6ff', color: '#3b82f6', border: '1px solid #bfdbfe', borderRadius: 6, padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 };
  const btnSupprimer = { background: '#fef2f2', color: '#ef4444', border: '1px solid #fecaca', borderRadius: 6, padding: '4px 10px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600 };

  const roleColors = {
    administrateur: '#ef4444', enseignant: '#3b82f6',
    delegue: '#10b981', surveillant: '#f59e0b',
    comptable: '#8b5cf6', etudiant: '#6b7280'
  };

  return (
    <div style={{ padding: 32 }}>

      {/* En-tête */}
      <div style={{ marginBottom: 24 }}>
        <h4 style={{ margin: 0, fontWeight: 800, color: '#1e293b' }}>⚙️ Gestion des référentiels</h4>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
          Gérez les classes, matières, salles, enseignants et sessions actives
        </p>
      </div>

      {/* Modal modification */}
      {enModification && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: 'white', borderRadius: 16, padding: 32, width: '90%', maxWidth: 500, boxShadow: '0 20px 60px rgba(0,0,0,0.2)' }}>
            <h5 style={{ fontWeight: 700, marginBottom: 20 }}>✏️ Modifier {enModification.type}</h5>

            {enModification.type === 'classe' && (
              <div className="row g-3">
                <div className="col-md-6"><label className="form-label">Code</label><input className="form-control" value={enModification.data.code} onChange={e => setEnModification(m => ({ ...m, data: { ...m.data, code: e.target.value } }))} /></div>
                <div className="col-md-6"><label className="form-label">Libellé</label><input className="form-control" value={enModification.data.libelle} onChange={e => setEnModification(m => ({ ...m, data: { ...m.data, libelle: e.target.value } }))} /></div>
                <div className="col-md-6"><label className="form-label">Niveau</label><input className="form-control" value={enModification.data.niveau} onChange={e => setEnModification(m => ({ ...m, data: { ...m.data, niveau: e.target.value } }))} /></div>
                <div className="col-md-6"><label className="form-label">Année</label><input className="form-control" value={enModification.data.annee_academique} onChange={e => setEnModification(m => ({ ...m, data: { ...m.data, annee_academique: e.target.value } }))} /></div>
              </div>
            )}

            {enModification.type === 'matiere' && (
              <div className="row g-3">
                <div className="col-md-6"><label className="form-label">Code</label><input className="form-control" value={enModification.data.code} onChange={e => setEnModification(m => ({ ...m, data: { ...m.data, code: e.target.value } }))} /></div>
                <div className="col-md-6"><label className="form-label">Libellé</label><input className="form-control" value={enModification.data.libelle} onChange={e => setEnModification(m => ({ ...m, data: { ...m.data, libelle: e.target.value } }))} /></div>
                <div className="col-md-6"><label className="form-label">Volume horaire</label><input type="number" className="form-control" value={enModification.data.volume_horaire_total} onChange={e => setEnModification(m => ({ ...m, data: { ...m.data, volume_horaire_total: e.target.value } }))} /></div>
                <div className="col-md-6"><label className="form-label">Coefficient</label><input type="number" className="form-control" value={enModification.data.coefficient} onChange={e => setEnModification(m => ({ ...m, data: { ...m.data, coefficient: e.target.value } }))} /></div>
              </div>
            )}

            {enModification.type === 'salle' && (
              <div className="row g-3">
                <div className="col-md-6"><label className="form-label">Code</label><input className="form-control" value={enModification.data.code} onChange={e => setEnModification(m => ({ ...m, data: { ...m.data, code: e.target.value } }))} /></div>
                <div className="col-md-6"><label className="form-label">Capacité</label><input type="number" className="form-control" value={enModification.data.capacite} onChange={e => setEnModification(m => ({ ...m, data: { ...m.data, capacite: e.target.value } }))} /></div>
                <div className="col-md-6"><label className="form-label">Équipements</label><input className="form-control" value={enModification.data.equipements} onChange={e => setEnModification(m => ({ ...m, data: { ...m.data, equipements: e.target.value } }))} /></div>
                <div className="col-md-6"><label className="form-label">Bâtiment</label><input className="form-control" value={enModification.data.batiment} onChange={e => setEnModification(m => ({ ...m, data: { ...m.data, batiment: e.target.value } }))} /></div>
              </div>
            )}

            {enModification.type === 'enseignant' && (
              <div className="row g-3">
                <div className="col-md-6"><label className="form-label">Matricule</label><input className="form-control" value={enModification.data.matricule} onChange={e => setEnModification(m => ({ ...m, data: { ...m.data, matricule: e.target.value } }))} /></div>
                <div className="col-md-6"><label className="form-label">Nom</label><input className="form-control" value={enModification.data.nom} onChange={e => setEnModification(m => ({ ...m, data: { ...m.data, nom: e.target.value } }))} /></div>
                <div className="col-md-6"><label className="form-label">Prénom</label><input className="form-control" value={enModification.data.prenom} onChange={e => setEnModification(m => ({ ...m, data: { ...m.data, prenom: e.target.value } }))} /></div>
                <div className="col-md-6"><label className="form-label">Email</label><input className="form-control" value={enModification.data.email} onChange={e => setEnModification(m => ({ ...m, data: { ...m.data, email: e.target.value } }))} /></div>
                <div className="col-md-6"><label className="form-label">Spécialité</label><input className="form-control" value={enModification.data.specialite} onChange={e => setEnModification(m => ({ ...m, data: { ...m.data, specialite: e.target.value } }))} /></div>
                <div className="col-md-6"><label className="form-label">Statut</label>
                  <select className="form-select" value={enModification.data.statut} onChange={e => setEnModification(m => ({ ...m, data: { ...m.data, statut: e.target.value } }))}>
                    <option value="vacataire">Vacataire</option>
                    <option value="permanent">Permanent</option>
                  </select>
                </div>
                <div className="col-md-6"><label className="form-label">Taux horaire</label><input type="number" className="form-control" value={enModification.data.taux_horaire} onChange={e => setEnModification(m => ({ ...m, data: { ...m.data, taux_horaire: e.target.value } }))} /></div>
              </div>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 24, justifyContent: 'flex-end' }}>
              <button onClick={() => setEnModification(null)} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>Annuler</button>
              <button onClick={modifier} style={{ background: 'linear-gradient(135deg, #1a56db, #7e3af2)', color: 'white', border: 'none', borderRadius: 8, padding: '10px 20px', cursor: 'pointer', fontWeight: 600 }}>💾 Enregistrer</button>
            </div>
          </div>
        </div>
      )}

      {/* Onglets */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        {['classes','matieres','salles','enseignants','sessions'].map(t => (
          <button key={t} onClick={() => setOnglet(t)} style={{
            padding: '10px 20px', borderRadius: 10, cursor: 'pointer',
            fontWeight: 600, fontSize: '0.9rem', border: 'none',
            background: onglet === t ? 'linear-gradient(135deg, #1a56db, #7e3af2)' : '#f1f5f9',
            color: onglet === t ? 'white' : '#374151'
          }}>
            {t === 'classes'     && '🏫 Classes'}
            {t === 'matieres'    && '📚 Matières'}
            {t === 'salles'      && '🚪 Salles'}
            {t === 'enseignants' && '👨‍🏫 Enseignants'}
            {t === 'sessions'    && '🟢 Sessions actives'}
          </button>
        ))}
      </div>

      {/* ===== CLASSES ===== */}
      {onglet === 'classes' && (
        <div>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <h6 style={{ fontWeight: 700, marginBottom: 16 }}>+ Nouvelle classe</h6>
            <div className="row g-2">
              <div className="col-md-3"><input className="form-control" placeholder="Code (ex: L1-RST)" value={formClasse.code} onChange={e => setFormClasse(f => ({ ...f, code: e.target.value }))} /></div>
              <div className="col-md-3"><input className="form-control" placeholder="Libellé" value={formClasse.libelle} onChange={e => setFormClasse(f => ({ ...f, libelle: e.target.value }))} /></div>
              <div className="col-md-3"><input className="form-control" placeholder="Niveau" value={formClasse.niveau} onChange={e => setFormClasse(f => ({ ...f, niveau: e.target.value }))} /></div>
              <div className="col-md-3"><button onClick={creerClasse} style={{ width: '100%', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 600, cursor: 'pointer' }}>+ Ajouter</button></div>
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <table className="table table-hover mb-0">
              <thead style={{ background: '#f8fafc' }}><tr><th>Code</th><th>Libellé</th><th>Niveau</th><th>Année</th><th>Actions</th></tr></thead>
              <tbody>
                {classes.map(c => (
                  <tr key={c.id}>
                    <td><strong>{c.code}</strong></td><td>{c.libelle}</td><td>{c.niveau}</td><td>{c.annee_academique}</td>
                    <td><div style={{ display: 'flex', gap: 6 }}>
                      <button style={btnModifier} onClick={() => setEnModification({ type: 'classe', data: { ...c } })}>✏️ Modifier</button>
                      <button style={btnSupprimer} onClick={() => supprimer('classe', c.id)}>🗑️ Supprimer</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== MATIÈRES ===== */}
      {onglet === 'matieres' && (
        <div>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <h6 style={{ fontWeight: 700, marginBottom: 16 }}>+ Nouvelle matière</h6>
            <div className="row g-2">
              <div className="col-md-2"><input className="form-control" placeholder="Code" value={formMatiere.code} onChange={e => setFormMatiere(f => ({ ...f, code: e.target.value }))} /></div>
              <div className="col-md-4"><input className="form-control" placeholder="Libellé" value={formMatiere.libelle} onChange={e => setFormMatiere(f => ({ ...f, libelle: e.target.value }))} /></div>
              <div className="col-md-2"><input type="number" className="form-control" placeholder="Volume horaire" value={formMatiere.volume_horaire_total} onChange={e => setFormMatiere(f => ({ ...f, volume_horaire_total: e.target.value }))} /></div>
              <div className="col-md-2"><input type="number" className="form-control" placeholder="Coefficient" value={formMatiere.coefficient} onChange={e => setFormMatiere(f => ({ ...f, coefficient: e.target.value }))} /></div>
              <div className="col-md-2"><button onClick={creerMatiere} style={{ width: '100%', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 600, cursor: 'pointer' }}>+ Ajouter</button></div>
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <table className="table table-hover mb-0">
              <thead style={{ background: '#f8fafc' }}><tr><th>Code</th><th>Libellé</th><th>Volume horaire</th><th>Coefficient</th><th>Actions</th></tr></thead>
              <tbody>
                {matieres.map(m => (
                  <tr key={m.id}>
                    <td><strong>{m.code}</strong></td><td>{m.libelle}</td><td>{m.volume_horaire_total}h</td><td>{m.coefficient}</td>
                    <td><div style={{ display: 'flex', gap: 6 }}>
                      <button style={btnModifier} onClick={() => setEnModification({ type: 'matiere', data: { ...m } })}>✏️ Modifier</button>
                      <button style={btnSupprimer} onClick={() => supprimer('matiere', m.id)}>🗑️ Supprimer</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== SALLES ===== */}
      {onglet === 'salles' && (
        <div>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <h6 style={{ fontWeight: 700, marginBottom: 16 }}>+ Nouvelle salle</h6>
            <div className="row g-2">
              <div className="col-md-2"><input className="form-control" placeholder="Code" value={formSalle.code} onChange={e => setFormSalle(f => ({ ...f, code: e.target.value }))} /></div>
              <div className="col-md-2"><input type="number" className="form-control" placeholder="Capacité" value={formSalle.capacite} onChange={e => setFormSalle(f => ({ ...f, capacite: e.target.value }))} /></div>
              <div className="col-md-3"><input className="form-control" placeholder="Équipements" value={formSalle.equipements} onChange={e => setFormSalle(f => ({ ...f, equipements: e.target.value }))} /></div>
              <div className="col-md-3"><input className="form-control" placeholder="Bâtiment" value={formSalle.batiment} onChange={e => setFormSalle(f => ({ ...f, batiment: e.target.value }))} /></div>
              <div className="col-md-2"><button onClick={creerSalle} style={{ width: '100%', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 600, cursor: 'pointer' }}>+ Ajouter</button></div>
            </div>
          </div>
          <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <table className="table table-hover mb-0">
              <thead style={{ background: '#f8fafc' }}><tr><th>Code</th><th>Capacité</th><th>Équipements</th><th>Bâtiment</th><th>Actions</th></tr></thead>
              <tbody>
                {salles.map(s => (
                  <tr key={s.id}>
                    <td><strong>{s.code}</strong></td><td>{s.capacite} places</td><td>{s.equipements}</td><td>{s.batiment}</td>
                    <td><div style={{ display: 'flex', gap: 6 }}>
                      <button style={btnModifier} onClick={() => setEnModification({ type: 'salle', data: { ...s } })}>✏️ Modifier</button>
                      <button style={btnSupprimer} onClick={() => supprimer('salle', s.id)}>🗑️ Supprimer</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== ENSEIGNANTS ===== */}
      {onglet === 'enseignants' && (
        <div>
          <div style={{ background: 'white', borderRadius: 16, padding: 24, marginBottom: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <h6 style={{ fontWeight: 700, marginBottom: 16 }}>+ Nouvel enseignant</h6>
            <div className="row g-2">
              <div className="col-md-2"><input className="form-control" placeholder="Matricule *" value={formEnseignant.matricule} onChange={e => setFormEnseignant(f => ({ ...f, matricule: e.target.value }))} /></div>
              <div className="col-md-2"><input className="form-control" placeholder="Nom *" value={formEnseignant.nom} onChange={e => setFormEnseignant(f => ({ ...f, nom: e.target.value }))} /></div>
              <div className="col-md-2"><input className="form-control" placeholder="Prénom" value={formEnseignant.prenom} onChange={e => setFormEnseignant(f => ({ ...f, prenom: e.target.value }))} /></div>
              <div className="col-md-2"><input className="form-control" placeholder="Email *" value={formEnseignant.email} onChange={e => setFormEnseignant(f => ({ ...f, email: e.target.value }))} /></div>
              <div className="col-md-2"><input className="form-control" placeholder="Spécialité" value={formEnseignant.specialite} onChange={e => setFormEnseignant(f => ({ ...f, specialite: e.target.value }))} /></div>
              <div className="col-md-2">
                <select className="form-select" value={formEnseignant.statut} onChange={e => setFormEnseignant(f => ({ ...f, statut: e.target.value }))}>
                  <option value="vacataire">Vacataire</option>
                  <option value="permanent">Permanent</option>
                </select>
              </div>
              <div className="col-md-2"><input type="number" className="form-control" placeholder="Taux horaire" value={formEnseignant.taux_horaire} onChange={e => setFormEnseignant(f => ({ ...f, taux_horaire: e.target.value }))} /></div>
              <div className="col-md-2"><input className="form-control" placeholder="Mot de passe" value={formEnseignant.password} onChange={e => setFormEnseignant(f => ({ ...f, password: e.target.value }))} /></div>
              <div className="col-md-2"><button onClick={creerEnseignant} style={{ width: '100%', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 600, cursor: 'pointer' }}>+ Ajouter</button></div>
            </div>
            <p style={{ marginTop: 8, fontSize: '0.8rem', color: '#64748b' }}>
              ⚠️ Le mot de passe par défaut est <strong>password</strong> — communiquez-le à l'enseignant
            </p>
          </div>
          <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <table className="table table-hover mb-0">
              <thead style={{ background: '#f8fafc' }}><tr><th>Matricule</th><th>Nom</th><th>Prénom</th><th>Email</th><th>Statut</th><th>Taux</th><th>Actions</th></tr></thead>
              <tbody>
                {enseignants.map(e => (
                  <tr key={e.id}>
                    <td><strong>{e.matricule}</strong></td>
                    <td>{e.nom}</td>
                    <td>{e.prenom}</td>
                    <td>{e.email}</td>
                    <td>
                      <span style={{ background: e.statut === 'permanent' ? '#f0fdf4' : '#eff6ff', color: e.statut === 'permanent' ? '#10b981' : '#3b82f6', padding: '2px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600 }}>
                        {e.statut}
                      </span>
                    </td>
                    <td>{parseFloat(e.taux_horaire).toLocaleString()} FCFA</td>
                    <td><div style={{ display: 'flex', gap: 6 }}>
                      <button style={btnModifier} onClick={() => setEnModification({ type: 'enseignant', data: { ...e } })}>✏️ Modifier</button>
                      <button style={btnSupprimer} onClick={() => supprimer('enseignant', e.id)}>🗑️ Supprimer</button>
                    </div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== SESSIONS ACTIVES ===== */}
      {onglet === 'sessions' && (
        <div>
          {/* Résumé */}
          <div className="row g-3 mb-4">
            <div className="col-md-4">
              <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderTop: '4px solid #10b981', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>🟢</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#10b981' }}>
                  {sessions.filter(s => s.statut_session === 'actif').length}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Sessions actives</div>
              </div>
            </div>
            <div className="col-md-4">
              <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderTop: '4px solid #3b82f6', textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: 8 }}>👥</div>
                <div style={{ fontSize: '2rem', fontWeight: 900, color: '#3b82f6' }}>
                  {sessions.length}
                </div>
                <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Connexions aujourd'hui</div>
              </div>
            </div>
            <div className="col-md-4">
              <div style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderTop: '4px solid #f59e0b', textAlign: 'center' }}>
                <button onClick={chargerTout} style={{ background: 'linear-gradient(135deg, #1a56db, #7e3af2)', color: 'white', border: 'none', borderRadius: 10, padding: '12px 24px', fontWeight: 600, cursor: 'pointer', fontSize: '1rem' }}>
                  🔄 Actualiser
                </button>
              </div>
            </div>
          </div>

          {/* Tableau des sessions */}
          <div style={{ background: 'white', borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #f1f5f9' }}>
              <h6 style={{ fontWeight: 700, margin: 0 }}>🔐 Sessions des dernières 24 heures</h6>
            </div>
            <table className="table table-hover mb-0">
              <thead style={{ background: '#f8fafc' }}>
                <tr>
                  <th>Utilisateur</th>
                  <th>Rôle</th>
                  <th>Adresse IP</th>
                  <th>Dernière connexion</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {sessions.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: 32 }}>Aucune session trouvée</td></tr>
                )}
                {sessions.map((s, i) => (
                  <tr key={i}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 36, height: 36, borderRadius: '50%', background: roleColors[s.role] || '#6b7280', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 700, fontSize: '0.9rem' }}>
                          {s.email?.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 600 }}>{s.email}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ background: roleColors[s.role] + '20', color: roleColors[s.role], padding: '3px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 600 }}>
                        {s.role}
                      </span>
                    </td>
                    <td><code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{s.ip}</code></td>
                    <td style={{ color: '#64748b', fontSize: '0.9rem' }}>
                      {new Date(s.date_heure).toLocaleString('fr-FR')}
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        il y a {s.minutes_depuis} min
                      </div>
                    </td>
                    <td>
                      <span style={{
                        background: s.statut_session === 'actif' ? '#f0fdf4' : '#f8fafc',
                        color: s.statut_session === 'actif' ? '#10b981' : '#94a3b8',
                        padding: '4px 12px', borderRadius: 20,
                        fontSize: '0.8rem', fontWeight: 600,
                        border: `1px solid ${s.statut_session === 'actif' ? '#86efac' : '#e2e8f0'}`
                      }}>
                        {s.statut_session === 'actif' ? '🟢 Actif' : '⚫ Inactif'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}