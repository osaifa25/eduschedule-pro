<?php
require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/jwt_helper.php';

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    authentifierRequete();
    $conn = getConnection();
    $where = [];
    if (isset($_GET['statut'])) $where[] = "statut='" . $conn->real_escape_string($_GET['statut']) . "'";
    if (isset($_GET['specialite'])) $where[] = "specialite LIKE '%" . $conn->real_escape_string($_GET['specialite']) . "%'";
    $sql = "SELECT * FROM enseignants";
    if ($where) $sql .= " WHERE " . implode(' AND ', $where);
    $result = $conn->query($sql);
    $data = [];
    while ($row = $result->fetch_assoc()) $data[] = $row;
    echo json_encode(['success' => true, 'data' => $data]);
    $conn->close();

} elseif ($method === 'POST') {
    verifierRole(['administrateur']);
    $d = json_decode(file_get_contents('php://input'), true);
    if (!isset($d['nom'], $d['prenom'], $d['email'], $d['matricule'])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => 'Champs requis manquants']);
        exit();
    }
    $conn = getConnection();
    $nom        = $conn->real_escape_string($d['nom']);
    $prenom     = $conn->real_escape_string($d['prenom']);
    $email      = $conn->real_escape_string($d['email']);
    $matricule  = $conn->real_escape_string($d['matricule']);
    $specialite = $conn->real_escape_string($d['specialite'] ?? '');
    $statut     = $conn->real_escape_string($d['statut'] ?? 'vacataire');
    $taux       = floatval($d['taux_horaire'] ?? 0);
    $conn->query("INSERT INTO enseignants (matricule, nom, prenom, email, specialite, statut, taux_horaire) 
                  VALUES ('$matricule','$nom','$prenom','$email','$specialite','$statut',$taux)");
    echo json_encode(['success' => true, 'message' => 'Enseignant créé', 'id' => $conn->insert_id]);
    $conn->close();

} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
}
?>