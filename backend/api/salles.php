<?php
/**
 * API Salles — Gestion CRUD des salles
 * EduSchedule Pro — ISGE RST 2025-2026
 */

require_once __DIR__ . '/../config/cors.php';
require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../middleware/jwt_helper.php';

$method = $_SERVER['REQUEST_METHOD'];
$id     = intval($_GET['id'] ?? 0);

// ---- GET : Liste des salles ----
if ($method === 'GET') {
    authentifierRequete();
    $conn   = getConnection();
    $result = $conn->query("SELECT * FROM salles ORDER BY code");
    $data   = [];
    while ($row = $result->fetch_assoc()) $data[] = $row;
    echo json_encode(['success' => true, 'data' => $data]);
    $conn->close();

// ---- POST : Créer une salle ----
} elseif ($method === 'POST') {
    verifierRole(['administrateur']);
    $d    = json_decode(file_get_contents('php://input'), true);
    $conn = getConnection();
    $code        = $conn->real_escape_string($d['code']        ?? '');
    $capacite    = intval($d['capacite']                       ?? 30);
    $equipements = $conn->real_escape_string($d['equipements'] ?? '');
    $batiment    = $conn->real_escape_string($d['batiment']    ?? '');
    $conn->query("INSERT INTO salles (code, capacite, equipements, batiment)
                  VALUES ('$code', $capacite, '$equipements', '$batiment')");
    echo json_encode(['success' => true, 'message' => 'Salle créée', 'id' => $conn->insert_id]);
    $conn->close();

// ---- PUT : Modifier une salle ----
} elseif ($method === 'PUT') {
    verifierRole(['administrateur']);
    $d    = json_decode(file_get_contents('php://input'), true);
    $conn = getConnection();
    $code        = $conn->real_escape_string($d['code']        ?? '');
    $capacite    = intval($d['capacite']                       ?? 30);
    $equipements = $conn->real_escape_string($d['equipements'] ?? '');
    $batiment    = $conn->real_escape_string($d['batiment']    ?? '');
    $conn->query("UPDATE salles SET code='$code', capacite=$capacite,
                  equipements='$equipements', batiment='$batiment'
                  WHERE id=$id");
    echo json_encode(['success' => true, 'message' => 'Salle modifiée']);
    $conn->close();

// ---- DELETE : Supprimer une salle ----
} elseif ($method === 'DELETE') {
    verifierRole(['administrateur']);
    $conn = getConnection();
    $conn->query("DELETE FROM salles WHERE id=$id");
    echo json_encode(['success' => true, 'message' => 'Salle supprimée']);
    $conn->close();

} else {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'Méthode non autorisée']);
}
?>