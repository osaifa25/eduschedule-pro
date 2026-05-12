<?php
/**
 * API Enseignants — Gestion CRUD des enseignants
 * EduSchedule Pro — ISGE RST 2025-2026
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/jwt_helper.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = intval($_GET['id'] ?? 0);

// ---- GET : Liste des enseignants ----
if ($method === 'GET') {
    authentifierRequete();
    $conn  = getConnection();
    $where = [];
    if (isset($_GET['statut']))     $where[] = "statut='" . $conn->real_escape_string($_GET['statut']) . "'";
    if (isset($_GET['specialite'])) $where[] = "specialite LIKE '%" . $conn->real_escape_string($_GET['specialite']) . "%'";
    $sql = "SELECT * FROM enseignants";
    if ($where) $sql .= " WHERE " . implode(' AND ', $where);
    $sql .= " ORDER BY nom";
    $result = $conn->query($sql);
    $data   = [];
    while ($row = $result->fetch_assoc()) $data[] = $row;
    echo json_encode(['success' => true, 'data' => $data]);
    $conn->close();

// ---- POST : Créer un enseignant + compte utilisateur ----
} elseif ($method === 'POST') {
    verifierRole(['administrateur']);
    $d = json_decode(file_get_contents('php://input'), true);

    if (!isset($d['nom'], $d['prenom'], $d['email'], $d['matricule'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Champs requis manquants']);
        exit();
    }

    $conn       = getConnection();
    $nom        = $conn->real_escape_string($d['nom']);
    $prenom     = $conn->real_escape_string($d['prenom']);
    $email      = $conn->real_escape_string($d['email']);
    $matricule  = $conn->real_escape_string($d['matricule']);
    $specialite = $conn->real_escape_string($d['specialite'] ?? '');
    $statut     = $conn->real_escape_string($d['statut']     ?? 'vacataire');
    $taux       = floatval($d['taux_horaire'] ?? 0);
    $password   = $d['password'] ?? 'password';

    // Vérifier si email déjà utilisé
    $check = $conn->query("SELECT id FROM utilisateurs WHERE email = '$email'");
    if ($check->num_rows > 0) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Cet email est déjà utilisé']);
        exit();
    }

    // 1. Créer l'enseignant
    $conn->query("INSERT INTO enseignants 
                  (matricule, nom, prenom, email, specialite, statut, taux_horaire)
                  VALUES ('$matricule','$nom','$prenom','$email','$specialite','$statut',$taux)");
    $id_enseignant = $conn->insert_id;

    // 2. Créer le compte utilisateur lié
    $hash = $conn->real_escape_string(password_hash($password, PASSWORD_DEFAULT));
    $conn->query("INSERT INTO utilisateurs (email, mot_de_passe_hash, role, id_lien, actif)
                  VALUES ('$email', '$hash', 'enseignant', $id_enseignant, 1)");

    echo json_encode([
        'success'  => true,
        'message'  => 'Enseignant créé avec compte de connexion',
        'id'       => $id_enseignant,
        'email'    => $email,
        'password' => $password
    ]);
    $conn->close();

// ---- PUT : Modifier un enseignant ----
} elseif ($method === 'PUT') {
    verifierRole(['administrateur']);
    $d          = json_decode(file_get_contents('php://input'), true);
    $conn       = getConnection();
    $nom        = $conn->real_escape_string($d['nom']        ?? '');
    $prenom     = $conn->real_escape_string($d['prenom']     ?? '');
    $email      = $conn->real_escape_string($d['email']      ?? '');
    $matricule  = $conn->real_escape_string($d['matricule']  ?? '');
    $specialite = $conn->real_escape_string($d['specialite'] ?? '');
    $statut     = $conn->real_escape_string($d['statut']     ?? 'vacataire');
    $taux       = floatval($d['taux_horaire'] ?? 0);

    $conn->query("UPDATE enseignants SET
                  nom='$nom', prenom='$prenom', email='$email',
                  matricule='$matricule', specialite='$specialite',
                  statut='$statut', taux_horaire=$taux
                  WHERE id=$id");

    // Modifier aussi l'email dans utilisateurs
    $conn->query("UPDATE utilisateurs SET email='$email' 
                  WHERE id_lien=$id AND role='enseignant'");

    echo json_encode(['success' => true, 'message' => 'Enseignant modifié']);
    $conn->close();

// ---- DELETE : Supprimer un enseignant ----
} elseif ($method === 'DELETE') {
    verifierRole(['administrateur']);
    $conn = getConnection();
    $conn->query("DELETE FROM utilisateurs WHERE id_lien=$id AND role='enseignant'");
    $conn->query("DELETE FROM enseignants WHERE id=$id");
    echo json_encode(['success' => true, 'message' => 'Enseignant et compte supprimés']);
    $conn->close();

} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
}
?>