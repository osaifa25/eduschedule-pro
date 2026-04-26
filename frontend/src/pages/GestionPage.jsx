import React, { useEffect, useState } from 'react';
import api from '../utils/api';

export default function GestionPage() {
  const [onglet, setOnglet] = useState('classes');
  const [classes, setClasses]         = useState([]);
  const [matieres, setMatieres]       = useState([]);
  const [salles, setSalles]           = useState([]);
  const [enseignants, setEnseignants] = useState([]);

  // Formulaires
  const [formClasse, setFormClasse]       = useState({ code: '', libelle: '', niveau: '' });
  const [formMatiere, setFormMatiere]     = useState({ code: '', libelle: '', volume_horaire_total: 0, coefficient: 1 });
  const [formSalle, setFormSalle]         = useState({ code: '', capacite: 30, equipements: '', batiment: '' });
  const [formEnseignant, setFormEnseignant] = useState({ matricule: '', nom: '', prenom: '', email: '', specialite: '', statut: 'vacataire', taux_horaire: 0 });

  useEffect(() => {
    api.get('/classes.php').then(r => setClasses(r.data.data));
    api.get('/matieres.php').then(r => setMatieres(r.data.data));
    api.get('/salles.php').then(r => setSalles(r.data.data));
    api.get('/enseignants.php').then(r => setEnseignants(r.data.data));
  }, []);

  const creerClasse = async () => {
    await api.post('/classes.php', formClasse);
    api.get('/classes.php').then(r => setClasses(r.data.data));
    setFormClasse({ code: '', libelle: '', niveau: '' });
    alert('Classe créée !');
  };

  const creerMatiere = async () => {
    await api.post('/matieres.php', formMatiere);
    api.get('/matieres.php').then(r => setMatieres(r.data.data));
    setFormMatiere({ code: '', libelle: '', volume_horaire_total: 0, coefficient: 1 });
    alert('Matière créée !');
  };

  const creerSalle = async () => {
    await api.post('/salles.php', formSalle);
    api.get('/salles.php').then(r => setSalles(r.data.data));
    setFormSalle({ code: '', capacite: 30, equipements: '', batiment: '' });
    alert('Salle créée !');
  };

  const creerEnseignant = async () => {
    await api.post('/enseignants.php', formEnseignant);
    api.get('/enseignants.php').then(r => setEnseignants(r.data.data));
    alert('Enseignant créé !');
  };

  return (
    <div>
      <h4 className="mb-3">Gestion des référentiels</h4>
      <ul className="nav nav-tabs mb-4">
        {['classes','matieres','salles','enseignants'].map(t => (
          <li key={t} className="nav-item">
            <button className={`nav-link ${onglet === t ? 'active' : ''}`} onClick={() => setOnglet(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          </li>
        ))}
      </ul>

      {/* Classes */}
      {onglet === 'classes' && (
        <div>
          <div className="card p-3 mb-3">
            <h6>Nouvelle classe</h6>
            <div className="row g-2">
              <div className="col-md-3"><input className="form-control" placeholder="Code (ex: L1-RST)" value={formClasse.code} onChange={e => setFormClasse(f => ({...f, code: e.target.value}))} /></div>
              <div className="col-md-4"><input className="form-control" placeholder="Libellé" value={formClasse.libelle} onChange={e => setFormClasse(f => ({...f, libelle: e.target.value}))} /></div>
              <div className="col-md-3"><input className="form-control" placeholder="Niveau" value={formClasse.niveau} onChange={e => setFormClasse(f => ({...f, niveau: e.target.value}))} /></div>
              <div className="col-md-2"><button className="btn btn-primary w-100" onClick={creerClasse}>Ajouter</button></div>
            </div>
          </div>
          <table className="table table-bordered shadow-sm">
            <thead className="table-light"><tr><th>Code</th><th>Libellé</th><th>Niveau</th><th>Année</th></tr></thead>
            <tbody>{classes.map(c => <tr key={c.id}><td>{c.code}</td><td>{c.libelle}</td><td>{c.niveau}</td><td>{c.annee_academique}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {/* Matières */}
      {onglet === 'matieres' && (
        <div>
          <div className="card p-3 mb-3">
            <h6>Nouvelle matière</h6>
            <div className="row g-2">
              <div className="col-md-2"><input className="form-control" placeholder="Code" value={formMatiere.code} onChange={e => setFormMatiere(f => ({...f, code: e.target.value}))} /></div>
              <div className="col-md-4"><input className="form-control" placeholder="Libellé" value={formMatiere.libelle} onChange={e => setFormMatiere(f => ({...f, libelle: e.target.value}))} /></div>
              <div className="col-md-2"><input type="number" className="form-control" placeholder="Volume horaire" value={formMatiere.volume_horaire_total} onChange={e => setFormMatiere(f => ({...f, volume_horaire_total: e.target.value}))} /></div>
              <div className="col-md-2"><input type="number" className="form-control" placeholder="Coefficient" value={formMatiere.coefficient} onChange={e => setFormMatiere(f => ({...f, coefficient: e.target.value}))} /></div>
              <div className="col-md-2"><button className="btn btn-primary w-100" onClick={creerMatiere}>Ajouter</button></div>
            </div>
          </div>
          <table className="table table-bordered shadow-sm">
            <thead className="table-light"><tr><th>Code</th><th>Libellé</th><th>Volume horaire</th><th>Coefficient</th></tr></thead>
            <tbody>{matieres.map(m => <tr key={m.id}><td>{m.code}</td><td>{m.libelle}</td><td>{m.volume_horaire_total}h</td><td>{m.coefficient}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {/* Salles */}
      {onglet === 'salles' && (
        <div>
          <div className="card p-3 mb-3">
            <h6>Nouvelle salle</h6>
            <div className="row g-2">
              <div className="col-md-2"><input className="form-control" placeholder="Code" value={formSalle.code} onChange={e => setFormSalle(f => ({...f, code: e.target.value}))} /></div>
              <div className="col-md-2"><input type="number" className="form-control" placeholder="Capacité" value={formSalle.capacite} onChange={e => setFormSalle(f => ({...f, capacite: e.target.value}))} /></div>
              <div className="col-md-3"><input className="form-control" placeholder="Équipements" value={formSalle.equipements} onChange={e => setFormSalle(f => ({...f, equipements: e.target.value}))} /></div>
              <div className="col-md-3"><input className="form-control" placeholder="Bâtiment" value={formSalle.batiment} onChange={e => setFormSalle(f => ({...f, batiment: e.target.value}))} /></div>
              <div className="col-md-2"><button className="btn btn-primary w-100" onClick={creerSalle}>Ajouter</button></div>
            </div>
          </div>
          <table className="table table-bordered shadow-sm">
            <thead className="table-light"><tr><th>Code</th><th>Capacité</th><th>Équipements</th><th>Bâtiment</th></tr></thead>
            <tbody>{salles.map(s => <tr key={s.id}><td>{s.code}</td><td>{s.capacite}</td><td>{s.equipements}</td><td>{s.batiment}</td></tr>)}</tbody>
          </table>
        </div>
      )}

      {/* Enseignants */}
      {onglet === 'enseignants' && (
        <div>
          <div className="card p-3 mb-3">
            <h6>Nouvel enseignant</h6>
            <div className="row g-2">
              <div className="col-md-2"><input className="form-control" placeholder="Matricule" value={formEnseignant.matricule} onChange={e => setFormEnseignant(f => ({...f, matricule: e.target.value}))} /></div>
              <div className="col-md-2"><input className="form-control" placeholder="Nom" value={formEnseignant.nom} onChange={e => setFormEnseignant(f => ({...f, nom: e.target.value}))} /></div>
              <div className="col-md-2"><input className="form-control" placeholder="Prénom" value={formEnseignant.prenom} onChange={e => setFormEnseignant(f => ({...f, prenom: e.target.value}))} /></div>
              <div className="col-md-2"><input className="form-control" placeholder="Email" value={formEnseignant.email} onChange={e => setFormEnseignant(f => ({...f, email: e.target.value}))} /></div>
              <div className="col-md-2">
                <select className="form-select" value={formEnseignant.statut} onChange={e => setFormEnseignant(f => ({...f, statut: e.target.value}))}>
                  <option value="vacataire">Vacataire</option>
                  <option value="permanent">Permanent</option>
                </select>
              </div>
              <div className="col-md-2"><input type="number" className="form-control" placeholder="Taux horaire" value={formEnseignant.taux_horaire} onChange={e => setFormEnseignant(f => ({...f, taux_horaire: e.target.value}))} /></div>
              <div className="col-md-12"><button className="btn btn-primary" onClick={creerEnseignant}>Ajouter</button></div>
            </div>
          </div>
          <table className="table table-bordered shadow-sm">
            <thead className="table-light"><tr><th>Matricule</th><th>Nom</th><th>Prénom</th><th>Email</th><th>Statut</th><th>Taux</th></tr></thead>
            <tbody>{enseignants.map(e => <tr key={e.id}><td>{e.matricule}</td><td>{e.nom}</td><td>{e.prenom}</td><td>{e.email}</td><td>{e.statut}</td><td>{e.taux_horaire} FCFA</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
}