<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/jwt_helper.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';
$id     = intval($_GET['id'] ?? 0);

if ($method === 'GET' && $id === 0) {
    authentifierRequete();
    $conn = getConnection();
    $where = [];
    if (isset($_GET['id_enseignant'])) $where[] = "v.id_enseignant=" . intval($_GET['id_enseignant']);
    if (isset($_GET['mois']))  $where[] = "v.mois=" . intval($_GET['mois']);
    if (isset($_GET['annee'])) $where[] = "v.annee=" . intval($_GET['annee']);
    $sql = "SELECT v.*, e.nom, e.prenom FROM vacations v JOIN enseignants e ON v.id_enseignant=e.id";
    if ($where) $sql .= " WHERE " . implode(' AND ', $where);
    $result = $conn->query($sql);
    $data = [];
    while ($row = $result->fetch_assoc()) $data[] = $row;
    echo json_encode(['success' => true, 'data' => $data]);
    $conn->close();

} elseif ($method === 'POST' && $action === 'generer') {
    verifierRole(['administrateur', 'surveillant']);
    $d = json_decode(file_get_contents('php://input'), true);
    if (!isset($d['id_enseignant'], $d['mois'], $d['annee'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Champs requis manquants']);
        exit();
    }
    $conn = getConnection();
    $id_ens = intval($d['id_enseignant']);
    $mois   = intval($d['mois']);
    $annee  = intval($d['annee']);

    // Récupérer toutes les séances clôturées du mois
    $result = $conn->query("SELECT ct.id, ct.heure_fin_reelle, cr.heure_debut, cr.heure_fin, cr.id AS id_creneau,
                            e.taux_horaire
                            FROM cahiers_texte ct
                            JOIN creneaux cr ON ct.id_creneau = cr.id
                            JOIN emploi_temps et ON cr.id_emploi_temps = et.id
                            JOIN enseignants e ON cr.id_enseignant = e.id
                            WHERE cr.id_enseignant = $id_ens
                            AND ct.statut = 'cloture'
                            AND MONTH(ct.date_creation) = $mois
                            AND YEAR(ct.date_creation) = $annee");

    $lignes = [];
    $total_brut = 0;
    while ($row = $result->fetch_assoc()) {
        $debut = strtotime($row['heure_debut']);
        $fin   = strtotime($row['heure_fin_reelle'] ?? $row['heure_fin']);
        $duree = round(($fin - $debut) / 3600, 2);
        $montant = $duree * $row['taux_horaire'];
        $total_brut += $montant;
        $lignes[] = [
            'id_creneau'   => $row['id_creneau'],
            'duree_heures' => $duree,
            'taux'         => $row['taux_horaire'],
            'montant'      => $montant
        ];
    }

    $montant_net = $total_brut; // Pas de retenue par défaut
    $conn->query("INSERT INTO vacations (id_enseignant, mois, annee, montant_brut, montant_net)
                  VALUES ($id_ens, $mois, $annee, $total_brut, $montant_net)");
    $id_vacation = $conn->insert_id;

    foreach ($lignes as $l) {
        $conn->query("INSERT INTO vacation_lignes (id_vacation, id_creneau, duree_heures, taux, montant)
                      VALUES ($id_vacation, {$l['id_creneau']}, {$l['duree_heures']}, {$l['taux']}, {$l['montant']})");
    }

    echo json_encode(['success' => true, 'message' => 'Fiche de vacation générée', 'id' => $id_vacation, 'montant_brut' => $total_brut]);
    $conn->close();

} elseif ($method === 'POST' && $action === 'valider') {
    $utilisateur = verifierRole(['surveillant']);
    $d = json_decode(file_get_contents('php://input'), true);
    $conn = getConnection();
    $visa        = $conn->real_escape_string($d['visa_base64'] ?? '');
    $commentaire = $conn->real_escape_string($d['commentaire'] ?? '');
    $uid = $utilisateur['id'];
    $conn->query("INSERT INTO validations (id_vacation, id_validateur, role_validateur, visa_base64, commentaire)
                  VALUES ($id, $uid, 'surveillant', '$visa', '$commentaire')");
    $conn->query("UPDATE vacations SET statut='visee_surveillant' WHERE id=$id");
    echo json_encode(['success' => true, 'message' => 'Vacation visée par le surveillant']);
    $conn->close();

} elseif ($method === 'POST' && $action === 'approuver') {
    $utilisateur = verifierRole(['comptable']);
    $d = json_decode(file_get_contents('php://input'), true);
    $conn = getConnection();
    $commentaire = $conn->real_escape_string($d['commentaire'] ?? '');
    $uid = $utilisateur['id'];
    $conn->query("INSERT INTO validations (id_vacation, id_validateur, role_validateur, commentaire)
                  VALUES ($id, $uid, 'comptable', '$commentaire')");
    $conn->query("UPDATE vacations SET statut='approuvee' WHERE id=$id");
    echo json_encode(['success' => true, 'message' => 'Vacation approuvée par le comptable']);
    $conn->close();

} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
}
?>