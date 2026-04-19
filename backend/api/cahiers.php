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
    if (isset($_GET['id_creneau'])) $where[] = "ct.id_creneau=" . intval($_GET['id_creneau']);
    $sql = "SELECT ct.*, cr.jour, cr.heure_debut, m.libelle AS matiere, c.libelle AS classe
            FROM cahiers_texte ct
            JOIN creneaux cr ON ct.id_creneau = cr.id
            JOIN emploi_temps et ON cr.id_emploi_temps = et.id
            JOIN matieres m ON cr.id_matiere = m.id
            JOIN classes c ON et.id_classe = c.id";
    if ($where) $sql .= " WHERE " . implode(' AND ', $where);
    $sql .= " ORDER BY ct.date_creation DESC";
    $result = $conn->query($sql);
    $data = [];
    while ($row = $result->fetch_assoc()) $data[] = $row;
    echo json_encode(['success' => true, 'data' => $data]);
    $conn->close();

} elseif ($method === 'GET' && $id > 0) {
    authentifierRequete();
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
    if ($result->num_rows === 0) {
        http_response_code(404);
        echo json_encode(['success' => false, 'message' => 'Cahier non trouvé']);
        exit();
    }
    $cahier = $result->fetch_assoc();
    // Travaux
    $travaux = [];
    $rt = $conn->query("SELECT * FROM travaux_demandes WHERE id_cahier=$id");
    while ($t = $rt->fetch_assoc()) $travaux[] = $t;
    $cahier['travaux'] = $travaux;
    // Signatures
    $signatures = [];
    $rs = $conn->query("SELECT * FROM signatures WHERE id_cahier=$id");
    while ($s = $rs->fetch_assoc()) $signatures[] = $s;
    $cahier['signatures'] = $signatures;
    echo json_encode(['success' => true, 'data' => $cahier]);
    $conn->close();

} elseif ($method === 'POST' && $action === '') {
    $utilisateur = verifierRole(['delegue']);
    $d = json_decode(file_get_contents('php://input'), true);
    if (!isset($d['id_creneau'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'id_creneau requis']);
        exit();
    }
    $conn = getConnection();
    $id_creneau = intval($d['id_creneau']);
    $id_delegue = $utilisateur['id'];
    $titre      = $conn->real_escape_string($d['titre_cours'] ?? '');
    $contenu    = $conn->real_escape_string(json_encode($d['contenu_json'] ?? []));
    $conn->query("INSERT INTO cahiers_texte (id_creneau, id_delegue, titre_cours, contenu_json)
                  VALUES ($id_creneau, $id_delegue, '$titre', '$contenu')");
    $id_cahier = $conn->insert_id;
    // Travaux
    if (!empty($d['travaux'])) {
        foreach ($d['travaux'] as $t) {
            $desc  = $conn->real_escape_string($t['description']);
            $date  = $conn->real_escape_string($t['date_limite'] ?? '');
            $type  = $conn->real_escape_string($t['type'] ?? 'devoir');
            $conn->query("INSERT INTO travaux_demandes (id_cahier, description, date_limite, type)
                          VALUES ($id_cahier, '$desc', " . ($date ? "'$date'" : "NULL") . ", '$type')");
        }
    }
    echo json_encode(['success' => true, 'message' => 'Cahier créé', 'id' => $id_cahier]);
    $conn->close();

} elseif ($method === 'POST' && $action === 'signer') {
    $utilisateur = authentifierRequete();
    $d = json_decode(file_get_contents('php://input'), true);
    if (!isset($d['signature_base64'], $d['type'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Signature et type requis']);
        exit();
    }
    $conn = getConnection();
    $sig  = $conn->real_escape_string($d['signature_base64']);
    $type = $conn->real_escape_string($d['type']);
    $uid  = $utilisateur['id'];
    $conn->query("INSERT INTO signatures (id_cahier, type_signataire, id_utilisateur, signature_base64)
                  VALUES ($id, '$type', $uid, '$sig')");
    $nouveauStatut = $type === 'delegue' ? 'signe_delegue' : 'cloture';
    $conn->query("UPDATE cahiers_texte SET statut='$nouveauStatut' WHERE id=$id");
    echo json_encode(['success' => true, 'message' => 'Signature enregistrée']);
    $conn->close();

} elseif ($method === 'POST' && $action === 'cloture') {
    $utilisateur = verifierRole(['enseignant']);
    $d = json_decode(file_get_contents('php://input'), true);
    $conn = getConnection();
    $heure_fin = $conn->real_escape_string($d['heure_fin'] ?? date('H:i:s'));
    $sig       = $conn->real_escape_string($d['signature_base64'] ?? '');
    $uid       = $utilisateur['id'];
    $conn->query("UPDATE cahiers_texte SET heure_fin_reelle='$heure_fin', statut='cloture' WHERE id=$id");
    if ($sig) {
        $conn->query("INSERT INTO signatures (id_cahier, type_signataire, id_utilisateur, signature_base64)
                      VALUES ($id, 'enseignant', $uid, '$sig')");
    }
    echo json_encode(['success' => true, 'message' => 'Séance clôturée']);
    $conn->close();

} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
}
?>