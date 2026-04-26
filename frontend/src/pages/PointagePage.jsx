import React, { useRef, useState } from 'react';
import api from '../utils/api';

export default function PointagePage() {
  const [resultat, setResultat]   = useState(null);
  const [erreur, setErreur]       = useState('');
  const [scanning, setScanning]   = useState(false);
  const [tokenManuel, setTokenManuel] = useState('');
  const scannerRef = useRef(null);

  const pointer = async (token) => {
    try {
      const res = await api.post('/pointages.php?action=scan', { token_qr: token });
      setResultat(res.data);
      setErreur('');
    } catch (err) {
      setErreur(err.response?.data?.message || 'Erreur lors du pointage');
      setResultat(null);
    }
  };

  const demarrerScan = async () => {
    setScanning(true);
    setErreur('');
    try {
      const { Html5QrcodeScanner } = await import('html5-qrcode');
      scannerRef.current = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 250 });
      scannerRef.current.render(
        async (decodedText) => {
          scannerRef.current.clear();
          setScanning(false);
          await pointer(decodedText);
        },
        () => {}
      );
    } catch {
      setErreur('Erreur lors du démarrage du scanner');
      setScanning(false);
    }
  };

  const pointerManuellement = async () => {
    if (!tokenManuel.trim()) {
      setErreur('Entrez un token');
      return;
    }
    await pointer(tokenManuel.trim());
  };

  return (
    <div>
      <h4 className="mb-3">Pointage QR-Code</h4>

      {!resultat && (
        <div className="row g-3">
          {/* Scanner QR */}
          <div className="col-md-6">
            <div className="card p-3 shadow-sm">
              <h6>📷 Scanner le QR Code</h6>
              <p className="text-muted small">Utilisez la caméra pour scanner le QR Code affiché en salle</p>
              {!scanning ? (
                <button className="btn btn-primary" onClick={demarrerScan}>
                  Démarrer le scan
                </button>
              ) : (
                <button className="btn btn-danger" onClick={() => {
                  scannerRef.current?.clear();
                  setScanning(false);
                }}>
                  Arrêter le scan
                </button>
              )}
              <div id="qr-reader" className="mt-3"></div>
            </div>
          </div>

          {/* Saisie manuelle */}
          <div className="col-md-6">
            <div className="card p-3 shadow-sm">
              <h6>⌨️ Saisie manuelle du token</h6>
              <p className="text-muted small">En cas de problème technique, saisissez le token manuellement</p>
              <input
                type="text"
                className="form-control mb-2"
                placeholder="Collez le token ici..."
                value={tokenManuel}
                onChange={e => setTokenManuel(e.target.value)}
              />
              <button className="btn btn-outline-primary" onClick={pointerManuellement}>
                Valider le pointage
              </button>
            </div>
          </div>
        </div>
      )}

      {erreur && (
        <div className="alert alert-danger mt-3">{erreur}</div>
      )}

      {resultat && (
        <div className={`alert mt-3 ${resultat.statut === 'retard' ? 'alert-warning' : 'alert-success'}`}>
          <h5>✅ Pointage enregistré !</h5>
          <p><strong>Matière :</strong> {resultat.seance?.matiere}</p>
          <p><strong>Classe :</strong> {resultat.seance?.classe}</p>
          <p><strong>Statut :</strong> {resultat.statut === 'retard' ? '⚠️ Retard' : '✅ À l\'heure'}</p>
          <button className="btn btn-primary mt-2" onClick={() => {
            setResultat(null);
            setTokenManuel('');
          }}>
            Nouveau pointage
          </button>
        </div>
      )}
    </div>
  );
}