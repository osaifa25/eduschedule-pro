<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/jwt_helper.php';
require_once __DIR__ . '/../vendor/autoload.php';

// Accepter le token depuis GET
if (isset($_GET['token']) && !empty($_GET['token'])) {
    $token = urldecode($_GET['token']);
    $_SERVER['HTTP_AUTHORIZATION'] = 'Bearer ' . $token;
}

$utilisateur = authentifierRequete();
$type = $_GET['type'] ?? '';
$id   = intval($_GET['id'] ?? 0);

if ($type === 'vacation' && $id > 0) {
    $conn = getConnection();
    $result = $conn->query("SELECT v.*, e.nom, e.prenom, e.matricule, e.taux_horaire
                            FROM vacations v
                            JOIN enseignants e ON v.id_enseignant = e.id
                            WHERE v.id = $id");
    $vacation = $result->fetch_assoc();

    if (!$vacation) {
        http_response_code(404);
        die(json_encode(['success' => false, 'message' => 'Vacation non trouvée']));
    }

    $lignes = [];
    $rl = $conn->query("SELECT vl.*, m.libelle AS matiere, c.libelle AS classe,
                        cr.jour, cr.heure_debut, cr.heure_fin
                        FROM vacation_lignes vl
                        JOIN creneaux cr ON vl.id_creneau = cr.id
                        JOIN emploi_temps et ON cr.id_emploi_temps = et.id
                        JOIN matieres m ON cr.id_matiere = m.id
                        JOIN classes c ON et.id_classe = c.id
                        WHERE vl.id_vacation = $id");
    while ($l = $rl->fetch_assoc()) $lignes[] = $l;

    $moisNoms = ['','Janvier','Février','Mars','Avril','Mai','Juin',
                 'Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

    $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8');
    $pdf->SetCreator('EduSchedule Pro');
    $pdf->SetAuthor('ISGE');
    $pdf->SetTitle('Fiche de Vacation');
    $pdf->setPrintHeader(false);
    $pdf->setPrintFooter(false);
    $pdf->AddPage();
    $pdf->SetMargins(15, 15, 15);

    $lignesHTML = '';
    $totalHeures = 0;
    foreach ($lignes as $l) {
        $totalHeures += $l['duree_heures'];
        $lignesHTML .= '<tr>
            <td>' . $l['jour'] . '</td>
            <td>' . $l['matiere'] . '</td>
            <td>' . $l['classe'] . '</td>
            <td>' . substr($l['heure_debut'], 0, 5) . '</td>
            <td>' . substr($l['heure_fin'], 0, 5) . '</td>
            <td>' . $l['duree_heures'] . 'h</td>
            <td>' . number_format($l['taux'], 0, ',', ' ') . '</td>
            <td>' . number_format($l['montant'], 0, ',', ' ') . ' FCFA</td>
        </tr>';
    }

    $html = '
    <style>
        body { font-family: helvetica; font-size: 10px; color: #1e293b; }
        .titre { font-size: 20px; font-weight: bold; color: #1a56db; text-align: center; }
        .sous-titre { font-size: 11px; color: #64748b; text-align: center; }
        .section { background-color: #f8fafc; padding: 10px; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { background-color: #1a56db; color: white; padding: 7px 5px; font-size: 9px; text-align: left; }
        td { padding: 5px; border-bottom: 1px solid #e2e8f0; font-size: 9px; }
        .total-row { font-weight: bold; background-color: #eff6ff; }
        .montant-net { color: #10b981; font-weight: bold; }
        .sign-box { text-align: center; padding: 10px; }
    </style>

    <p class="titre">FICHE DE VACATION</p>
    <p class="sous-titre">Institut Supérieur de Génie Électrique — ISGE RST</p>
    <hr/>

    <div class="section">
        <table>
            <tr>
                <td><b>Enseignant :</b> ' . $vacation['prenom'] . ' ' . $vacation['nom'] . '</td>
                <td><b>Matricule :</b> ' . $vacation['matricule'] . '</td>
            </tr>
            <tr>
                <td><b>Période :</b> ' . $moisNoms[$vacation['mois']] . ' ' . $vacation['annee'] . '</td>
                <td><b>Taux horaire :</b> ' . number_format($vacation['taux_horaire'], 0, ',', ' ') . ' FCFA/h</td>
            </tr>
            <tr>
                <td><b>Statut :</b> ' . strtoupper($vacation['statut']) . '</td>
                <td><b>Généré le :</b> ' . date('d/m/Y', strtotime($vacation['date_generation'])) . '</td>
            </tr>
        </table>
    </div>

    <br/>
    <b>DÉTAIL DES SÉANCES RÉALISÉES</b>
    <table>
        <thead>
            <tr>
                <th>Jour</th><th>Matière</th><th>Classe</th>
                <th>Début</th><th>Fin</th><th>Durée</th>
                <th>Taux</th><th>Montant</th>
            </tr>
        </thead>
        <tbody>
            ' . ($lignesHTML ?: '<tr><td colspan="8" style="text-align:center">Aucune séance clôturée ce mois</td></tr>') . '
        </tbody>
    </table>

    <br/>
    <table>
        <tr class="total-row">
            <td><b>Total heures :</b> ' . $totalHeures . 'h</td>
            <td><b>Montant brut :</b> ' . number_format($vacation['montant_brut'], 0, ',', ' ') . ' FCFA</td>
            <td class="montant-net"><b>Montant net : ' . number_format($vacation['montant_net'], 0, ',', ' ') . ' FCFA</b></td>
        </tr>
    </table>

    <br/><br/>
    <table>
        <tr>
            <td class="sign-box" style="width:33%">
                <b>Signature Enseignant</b><br/><br/><br/>______________________
            </td>
            <td class="sign-box" style="width:33%">
                <b>Visa Surveillant</b><br/><br/><br/>______________________
            </td>
            <td class="sign-box" style="width:33%">
                <b>Validation Comptable</b><br/><br/><br/>______________________
            </td>
        </tr>
    </table>

    <br/>
    <p style="text-align:center; color:#94a3b8; font-size:8px;">
        Document généré automatiquement par EduSchedule Pro — ISGE RST 2025-2026
    </p>';

    $pdf->writeHTML($html, true, false, true, false, '');
    $pdf->Output('fiche_vacation_' . $vacation['nom'] . '_' . $moisNoms[$vacation['mois']] . '.pdf', 'D');
    $conn->close();

} elseif ($type === 'cahier' && $id > 0) {
    $conn = getConnection();
    $result = $conn->query("SELECT ct.*, cr.jour, cr.heure_debut, cr.heure_fin,
                            m.libelle AS matiere, c.libelle AS classe,
                            e.nom AS enseignant_nom, e.prenom AS enseignant_prenom
                            FROM cahiers_texte ct
                            JOIN creneaux cr ON ct.id_creneau = cr.id
                            JOIN emploi_temps et ON cr.id_emploi_temps = et.id
                            JOIN matieres m ON cr.id_matiere = m.id
                            JOIN classes c ON et.id_classe = c.id
                            JOIN enseignants e ON cr.id_enseignant = e.id
                            WHERE ct.id = $id");
    $cahier = $result->fetch_assoc();

    if (!$cahier) {
        http_response_code(404);
        die(json_encode(['success' => false, 'message' => 'Cahier non trouvé']));
    }

    $travaux = [];
    $rt = $conn->query("SELECT * FROM travaux_demandes WHERE id_cahier=$id");
    while ($t = $rt->fetch_assoc()) $travaux[] = $t;

    $contenu = '';
    if ($cahier['contenu_json']) {
        $decoded = json_decode($cahier['contenu_json'], true);
        $contenu = $decoded['points'] ?? $cahier['contenu_json'];
    }

    $travauxHTML = '';
    foreach ($travaux as $t) {
        $travauxHTML .= '<tr>
            <td>' . htmlspecialchars($t['description']) . '</td>
            <td>' . $t['type'] . '</td>
            <td>' . ($t['date_limite'] ?? '—') . '</td>
        </tr>';
    }

    $pdf = new TCPDF('P', 'mm', 'A4', true, 'UTF-8');
    $pdf->SetCreator('EduSchedule Pro');
    $pdf->SetTitle('Cahier de Texte');
    $pdf->setPrintHeader(false);
    $pdf->setPrintFooter(false);
    $pdf->AddPage();
    $pdf->SetMargins(15, 15, 15);

    $html = '
    <style>
        body { font-family: helvetica; font-size: 10px; }
        .titre { font-size: 20px; font-weight: bold; color: #1a56db; text-align: center; }
        .section { background-color: #f8fafc; padding: 10px; margin: 8px 0; }
        table { width: 100%; border-collapse: collapse; }
        th { background-color: #1a56db; color: white; padding: 7px; font-size: 9px; }
        td { padding: 5px 7px; border-bottom: 1px solid #e2e8f0; font-size: 9px; }
        h3 { font-size: 12px; color: #374151; margin: 12px 0 6px; }
    </style>

    <p class="titre">CAHIER DE TEXTE NUMÉRIQUE</p>
    <p style="text-align:center; color:#64748b; font-size:10px;">
        Institut Supérieur de Génie Électrique — ISGE RST
    </p>
    <hr/>

    <div class="section">
        <table>
            <tr>
                <td><b>Matière :</b> ' . $cahier['matiere'] . '</td>
                <td><b>Classe :</b> ' . $cahier['classe'] . '</td>
            </tr>
            <tr>
                <td><b>Enseignant :</b> ' . $cahier['enseignant_prenom'] . ' ' . $cahier['enseignant_nom'] . '</td>
                <td><b>Jour :</b> ' . $cahier['jour'] . '</td>
            </tr>
            <tr>
                <td><b>Heure début :</b> ' . substr($cahier['heure_debut'], 0, 5) . '</td>
                <td><b>Heure fin :</b> ' . ($cahier['heure_fin_reelle'] ?? substr($cahier['heure_fin'], 0, 5)) . '</td>
            </tr>
            <tr>
                <td colspan="2"><b>Statut :</b> ' . strtoupper($cahier['statut']) . '</td>
            </tr>
        </table>
    </div>

    <h3>Titre du cours</h3>
    <div class="section">' . htmlspecialchars($cahier['titre_cours'] ?? '') . '</div>

    <h3>Points vus dans le cours</h3>
    <div class="section">' . htmlspecialchars($contenu) . '</div>

    ' . (!empty($travaux) ? '
    <h3>Travaux demandés</h3>
    <table>
        <thead>
            <tr><th>Description</th><th>Type</th><th>Date limite</th></tr>
        </thead>
        <tbody>' . $travauxHTML . '</tbody>
    </table>' : '') . '

    <br/><br/>
    <table>
        <tr>
            <td style="text-align:center; width:50%; padding:20px;">
                <b>Signature Délégué</b><br/><br/><br/>______________________
            </td>
            <td style="text-align:center; width:50%; padding:20px;">
                <b>Signature Enseignant</b><br/><br/><br/>______________________
            </td>
        </tr>
    </table>

    <br/>
    <p style="text-align:center; color:#94a3b8; font-size:8px;">
        Document généré automatiquement par EduSchedule Pro — ISGE RST 2025-2026
    </p>';

    $pdf->writeHTML($html, true, false, true, false, '');
    $pdf->Output('cahier_' . $cahier['classe'] . '_' . $cahier['jour'] . '.pdf', 'D');
    $conn->close();

} else {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'Type ou ID invalide']);
}
?>